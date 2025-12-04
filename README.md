# Online Document Converter

A simple, fast, and clean web app to convert documents online:

- DOC/DOCX → PDF
- PPT/PPTX → PDF
- XLS/XLSX → PDF
- Images (JPG/PNG) → PDF
- PDF → DOCX/PPTX/XLSX/JPG/PNG

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python + FastAPI
- **Conversion Engine:** LibreOffice (headless) + ImageMagick (for PDF to image)

## Features

- Drag & drop file upload
- Real-time file conversion
- Automatic download after conversion
- Error handling with user-friendly messages
- Loading states during conversion
- Files stored only temporarily and auto-cleaned
- Secure backend with CORS support

## Project Structure

\`\`\`text
backend/              # FastAPI API + conversion logic
  ├── main.py        # API endpoints + file cleanup
  ├── converters.py  # Conversion logic
  └── requirements.txt
frontend/             # React + TypeScript UI
  ├── src/
  │   ├── App.tsx    # Main UI component
  │   ├── api.ts     # API client
  │   └── main.tsx   # Entry point
  └── index.html
docker-compose.yml    # Docker orchestration
\`\`\`

## Quick Start

### Option 1: Docker (Recommended)

\`\`\`bash
docker-compose up --build
\`\`\`

Then open: **http://localhost:5173**

### Option 2: Local Development

See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed instructions.

**Quick commands:**
\`\`\`bash
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend  
./start-frontend.sh
\`\`\`

**Note:** Local development requires LibreOffice and ImageMagick for full conversion features.

## Requirements

### For Docker
- Docker & Docker Compose

### For Local Development
- Python 3.9+
- Node.js 18+
- LibreOffice (optional - for Office document conversions)
- ImageMagick (optional - for PDF to image conversions)

## API Documentation

Once the backend is running, visit:
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## Supported Conversions

| From | To |
|------|-----|
| DOC, DOCX, PPT, PPTX, XLS, XLSX | PDF |
| PDF | DOCX, PPTX, XLSX, JPG, PNG |

## Security

- File size limit: 25MB
- Files automatically deleted after conversion
- CORS properly configured
- Input validation on all uploads
- No file persistence beyond request lifecycle

## License

MIT

