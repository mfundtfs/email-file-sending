# Backend Configuration

## Environment Setup

This project uses environment variables for API configuration. All environment variables are prefixed with `VITE_` to be accessible in the Vite build.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_BASE_URL=http://192.168.125.203:5000
VITE_UPLOAD_ENDPOINT=/email_send_import/upload
```

### API Configuration

The application uses FormData to send file uploads to the backend server.

#### Upload API

- **Endpoint**: `POST http://192.168.125.203:5000/email_send_import/upload`
- **Request Type**: FormData
- **Request Key**: `file` (contains the Excel file)
- **Supported File Types**: `.xlsx`, `.xls`
- **Max File Size**: 100MB
- **Timeout**: 2 minutes

#### Response Format

Success Response (Status 200):
```json
{
  "data": {
    "inserted": 12,
    "skipped": 0,
    "total_rows_in_file": 12,
    "unsubscribed_overrides": 2
  },
  "message": "Imported successfully",
  "status": 200
}
```

Error Response:
```json
{
  "message": "Error description",
  "status": 400
}
```

## File Structure

```
app/
├── lib/
│   ├── api.ts          # API service layer with uploadFile function
│   ├── toast.ts        # Toast notification utility
│   └── utils.ts        # General utilities
├── components/
│   └── file-upload-form.tsx  # Main upload form component
```

## API Service (`app/lib/api.ts`)

The API service provides:
- FormData upload with progress tracking
- XMLHttpRequest for real-time upload progress
- Proper error handling and timeout management
- TypeScript interfaces for type safety

### Usage Example

```typescript
import { uploadFile } from '../lib/api';

const response = await uploadFile(file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});

console.log(`Inserted: ${response.data.inserted}`);
```

## Features

- ✅ FormData file upload
- ✅ Real-time upload progress tracking
- ✅ File type validation (Excel only)
- ✅ File size validation (max 100MB)
- ✅ Drag and drop support
- ✅ Error handling with user-friendly messages
- ✅ Success messages with upload statistics
- ✅ Automatic form reset after successful upload

## Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables if needed

3. Start the development server:
   ```bash
   npm run dev
   ```

## Notes

- The `.env` file is gitignored for security
- Always use `.env.example` as a template
- Never commit sensitive API keys or endpoints to version control
