// API Service for file upload

// Use proxy in development to avoid CORS issues
// The proxy is configured in vite.config.ts
// In production, use the full backend URL
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://tfshrms.cloud/email'
  : '/api';
const UPLOAD_ENDPOINT = '/email_send_import/upload';

export interface UploadResponse {
  data: {
    inserted: number;
    skipped: number;
    total_rows_in_file: number;
    unsubscribed_overrides: number;
    duplicates_no_change: number;
    updated: number;
    email_type: string;
  };
  message: string;
  status: number;
}

export interface UploadError {
  message: string;
  status?: number;
}

/**
 * Upload Excel file to the server
 * @param file - The Excel file to upload
 * @param emailType - The email type (GOLY or MPLY)
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload response
 */
export async function uploadFile(
  file: File,
  emailType: string,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('email_type', emailType);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    // Handle successful response
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: UploadResponse = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject({
            message: 'Invalid response from server',
            status: xhr.status
          } as UploadError);
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject({
            message: errorResponse.message || 'Upload failed',
            status: xhr.status
          } as UploadError);
        } catch {
          reject({
            message: `Upload failed with status ${xhr.status}`,
            status: xhr.status
          } as UploadError);
        }
      }
    });

    // Handle network errors
    xhr.addEventListener('error', () => {
      reject({
        message: 'Network error. Please check your connection.',
        status: 0
      } as UploadError);
    });

    // Handle timeout
    xhr.addEventListener('timeout', () => {
      reject({
        message: 'Upload timeout. Please try again.',
        status: 0
      } as UploadError);
    });

    // Handle abort
    xhr.addEventListener('abort', () => {
      reject({
        message: 'Upload cancelled.',
        status: 0
      } as UploadError);
    });

    // Open and send request
    const uploadUrl = `${API_BASE_URL}${UPLOAD_ENDPOINT}`;
    xhr.open('POST', uploadUrl);
    xhr.timeout = 120000; // 2 minute timeout
    xhr.send(formData);
  });
}

// Email Dashboard API Types
export interface SentEmailRecord {
  email_type: string;
  receiver_email: string;
  sender_email: string;
  sent_at: string;
  status: string;
  status_message: string;
  subject: string | null;
}

export interface RespondsEmailRecord {
  body: string | null;
  email_type: string;
  receiver_email: string;
  responds: string;
  sender_email: string;
  subject: string | null;
  updated_at: string;
}

export type EmailRecord = SentEmailRecord | RespondsEmailRecord;

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_pages: number;
  total_records: number;
}

export interface FiltersApplied {
  date: string | null;
  date_from: string;
  date_to: string;
  email_type: string;
  responds_filter?: string;
}

export interface MonthlyStats {
  monthly_not_responds: number;
  monthly_positive_responds: number;
  monthly_sent: number;
  monthly_unsubscribed: number;
}

export interface EmailReportResponse {
  status: number;
  message: string;
  data: {
    type: string;
    records: (SentEmailRecord | RespondsEmailRecord)[];
    pagination: PaginationInfo;
    filters_applied: FiltersApplied;
    monthly_stats: MonthlyStats;
  };
}

export interface EmailReportRequest {
  type: 'sent' | 'responds';
  email_type: string;
  date_from: string;
  date_to: string;
  page: number;
  per_page: number;
  responds_filter?: string;
}

export interface ResponseOption {
  label: string;
}

export interface RespondsOptionsResponse {
  data: {
    options: ResponseOption[];
  };
  message: string;
  status: number;
}

// Email Dashboard API Service
export const emailApi = {
  async getReport(request: EmailReportRequest): Promise<EmailReportResponse> {
    const endpoint = `${API_BASE_URL}/email_send_import/report`;
    console.log('Fetching from:', endpoint);
    console.log('Request payload:', request);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  async getRespondsOptions(): Promise<RespondsOptionsResponse> {
    const endpoint = `${API_BASE_URL}/email_send_import/responds-options`;
    console.log('Fetching response options from:', endpoint);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response options data:', data);
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },
};

// Unsubscribe API Types
export interface UnsubscribeResponse {
  data: {
    is_subscribed: number;
    k: string;
    receiver_email: string;
    sender_email: string;
  };
  message: string;
  status: number;
}

export interface UnsubscribeRequest {
  k: string;
  to: string;
  from: string;
}

/**
 * Unsubscribe from email notifications
 */
export const unsubscribeEmail = async (
  payload: UnsubscribeRequest
): Promise<UnsubscribeResponse> => {
  const response = await fetch(`${API_BASE_URL}/email_tracking/unsub`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to unsubscribe: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

