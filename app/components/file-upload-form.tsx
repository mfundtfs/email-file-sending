
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";
import { showToast } from "../lib/toast";
import { uploadFile, type UploadResponse, type UploadError } from "../lib/api";

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
];

export function FileUploadForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const [fileError, setFileError] = React.useState("");
  const [companyType, setCompanyType] = React.useState("");
  const [companyTypeError, setCompanyTypeError] = React.useState("");
  const [emailType, setEmailType] = React.useState("");
  const [emailTypeError, setEmailTypeError] = React.useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (!EXCEL_MIME_TYPES.includes(selectedFile.type)) {
        setFileError("Only Excel files are allowed.");
        setFile(null);
        return;
      }
      if (selectedFile.size > 100 * 1024 * 1024) {
        setFileError("File size must be less than 100MB.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setFileError("");
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCompanyTypeError("");
    setEmailTypeError("");
    
    if (!companyType) {
      setCompanyTypeError("Please select an email campaign.");
      setError("Please select an email campaign.");
      return;
    }
    
    if (!emailType) {
      setEmailTypeError("Please select an email type.");
      setError("Please select an email type.");
      return;
    }
    
    if (!file) {
      setFileError("Please upload an Excel file.");
      setError("Please upload an Excel file.");
      return;
    }
    
    setFileError("");
    setCompanyTypeError("");
    setEmailTypeError("");
    setLoading(true);
    setUploadProgress(0);

    try {
      const response: UploadResponse = await uploadFile(file, companyType, emailType, (progress) => {
        setUploadProgress(progress);
      });

      // Handle successful response
      if (response.status === 200) {
        const { data } = response;
        const successMessage = [
          response.message,
          `Email Type: ${data.email_type}`,
          `Total Records: ${data.total_rows_in_file}`,
          `Inserted: ${data.inserted}`,
          `Updated: ${data.updated}`,
          `Skipped: ${data.skipped}`,
          `Duplicates (No Change): ${data.duplicates_no_change}`,
          `Unsubscribed Overrides: ${data.unsubscribed_overrides}`
        ].join(' | ');
        
        showToast(successMessage, "success");
        
        // Reset form
        setFile(null);
        setCompanyType("");
        setEmailType("");
        setUploadProgress(null);
        
        // Reset file input
        const fileInput = document.getElementById('custom-file-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setError(response.message || "Upload failed. Please try again.");
        showToast(response.message || "Upload failed", "error");
      }
    } catch (error) {
      const uploadError = error as UploadError;
      const errorMessage = uploadError.message || "An error occurred during upload. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl bg-white border border-neutral-200 shadow-xl flex flex-col gap-6 px-8 py-8"
        style={{ boxShadow: '0 8px 32px 0 rgba(60, 60, 90, 0.10)' }}
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 tracking-tight">Upload Excel File</h2>
        
        {/* Email Campaign Dropdown */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="company-type" className="text-base text-blue-700 font-semibold">Email Campaign <span className="text-red-500">*</span></Label>
          <Select value={companyType} onValueChange={(value) => {
            setCompanyType(value);
            setCompanyTypeError("");
            setError("");
          }}>
            <SelectTrigger className={`w-full border-2 rounded-lg px-4 py-3 text-left hover:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white shadow-sm ${companyTypeError ? 'border-red-400 bg-red-50/50' : 'border-slate-300'}`}>
              <SelectValue placeholder="Select email campaign" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="GOLY">GOLY</SelectItem>
              <SelectItem value="MPLY">MPLY</SelectItem>
            </SelectContent>
          </Select>
          {companyTypeError && <span className="text-xs text-red-500 font-medium">{companyTypeError}</span>}
        </div>
        
        {/* Email Type Dropdown */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email-type" className="text-base text-blue-700 font-semibold">Email Type <span className="text-red-500">*</span></Label>
          <Select value={emailType} onValueChange={(value) => {
            setEmailType(value);
            setEmailTypeError("");
            setError("");
          }}>
            <SelectTrigger className={`w-full border-2 rounded-lg px-4 py-3 text-left hover:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white shadow-sm ${emailTypeError ? 'border-red-400 bg-red-50/50' : 'border-slate-300'}`}>
              <SelectValue placeholder="Select email type" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Follow up 1">Follow up 1</SelectItem>
            </SelectContent>
          </Select>
          {emailTypeError && <span className="text-xs text-red-500 font-medium">{emailTypeError}</span>}
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="custom-file-upload" className="text-base text-blue-700 font-semibold">Excel File <span className="text-red-500">*</span></Label>
          <div
            className={`relative border-2 border-dashed rounded-lg px-4 py-6 text-center transition-all cursor-pointer group ${fileError ? 'border-red-400 bg-red-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'}`}
            onClick={() => !loading && document.getElementById('custom-file-upload')?.click()}
            onDrop={e => {
              e.preventDefault();
              if (loading) return;
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                const event = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileChange(event);
              }
            }}
            onDragOver={e => e.preventDefault()}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Click to upload <span className="text-blue-600">or drag and drop</span></p>
                <p className="text-xs text-slate-500 mt-1">Max file size: 100MB, Excel only</p>
                {file && <span className="block mt-2 text-xs text-blue-700 font-medium">Selected: {file.name}</span>}
                {loading && uploadProgress !== null && (
                  <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    <span className="block text-xs text-blue-700 font-medium mt-1">Uploading: {uploadProgress}%</span>
                  </div>
                )}
                {fileError && <span className="block mt-2 text-xs text-red-500 font-medium">{fileError}</span>}
              </div>
            </div>
            <input
              id="custom-file-upload"
              accept=".xlsx,.xls"
              className="hidden"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <Button
            type="submit"
            className="px-6 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg transition-all duration-200 tracking-wide flex items-center gap-2 border-0 outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            style={{ minWidth: 120 }}
          >
            <svg className="w-4 h-4 mr-2 -ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Submit
          </Button>
        </div>
        {error && (
          <div className="mt-4 text-red-500 text-center font-semibold text-base animate-pulse border border-red-200 bg-red-50 rounded-lg py-2 px-4">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
import * as React from "react";
