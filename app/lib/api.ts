// API Service for file upload

// In development, use proxy to avoid CORS issues
// In production, use the actual API URL from environment variables
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? '/api'  // Proxy endpoint in development
  : (import.meta.env.VITE_API_BASE_URL || 'http://192.168.125.203:5000');
const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT || '/email/email_send_import/upload';

export interface UploadResponse {
  data: {
    inserted: number;
    skipped: number;
    total_rows_in_file: number;
    unsubscribed_overrides: number;
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
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload response
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

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
