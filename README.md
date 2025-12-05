# 📄 Online Document Converter

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18.3+-61dafb.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ed.svg)

**A professional, feature-rich document conversion platform supporting 100+ format combinations**

[Features](#-features) • [Quick Start](#-quick-start) • [Demo](#-demo) • [API](#-api-endpoints) • [Deployment](#-deployment)

</div>

---

## 🌟 Overview

Online Document Converter is a modern, full-stack web application that provides seamless document conversion services. Built with performance and user experience in mind, it offers a clean interface for converting between various document formats including PDF, Office documents, and images.

### ✨ Key Highlights

- **100+ Format Combinations** - Convert between PDF, Word, Excel, PowerPoint, and image formats
- **Advanced PDF Tools** - Merge, split, and compress PDF files with ease
- **Professional UI** - Clean, responsive design inspired by industry leaders
- **Fast & Secure** - File processing with automatic cleanup and privacy protection
- **Production Ready** - Dockerized deployment with optimized performance

---

## 🎯 Features

### Document Conversion
- ✅ **PDF Conversion** - PDF ↔ Word, Excel, PowerPoint, JPG, PNG
- ✅ **Office Documents** - Word ↔ Excel ↔ PowerPoint (all combinations)
- ✅ **Image Conversion** - JPG ↔ PNG ↔ PDF
- ✅ **Legacy Formats** - Support for DOC, XLS, PPT (Office 97-2003)

### PDF Tools
- 🔗 **Merge PDF** - Combine multiple PDF files into one document
- ✂️ **Split PDF** - Extract specific pages or ranges from PDF files
- 📦 **Compress PDF** - Reduce file size with quality options (low/medium/high)

### User Experience
- 🎨 **Modern UI** - Animated gradients, smooth transitions, professional design
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🖱️ **Drag & Drop** - Intuitive file upload with drag-and-drop support
- ⚡ **Real-time Processing** - Live progress indicators and instant downloads
- 🔄 **Multi-page Navigation** - SPA architecture with smooth page transitions

### Security & Performance
- 🔒 **Privacy First** - Files automatically deleted after processing
- 🚀 **Fast Processing** - Optimized conversion engine with LibreOffice & Ghostscript
- 📊 **Smart Validation** - Client and server-side file validation
- 🛡️ **CORS Protected** - Secure API with proper CORS configuration

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 18.3 with TypeScript 5.6
- **Build Tool:** Vite 6.4 for blazing-fast development
- **Styling:** Custom CSS with animated gradients and modern design
- **State Management:** React Hooks (useState, useRef, useMemo)
- **API Client:** Fetch API with dynamic backend URL resolution

### Backend
- **Framework:** FastAPI (Python 3.11+) with async support
- **Conversion Engine:** 
  - LibreOffice (headless) for Office documents
  - pdf2docx for PDF to Word conversion
  - PyPDF2 for PDF manipulation (merge/split)
  - Ghostscript for PDF compression
  - ImageMagick for image conversions
  - Pillow for image processing
- **File Handling:** Temporary file management with automatic cleanup
- **API Documentation:** Auto-generated Swagger/OpenAPI docs

### DevOps
- **Containerization:** Docker & Docker Compose
- **Architecture:** Multi-container setup (frontend + backend)
- **Deployment:** Production-ready with health checks

---

## 📁 Project Structure

\`\`\`
online-document-converter/
├── backend/
│   ├── main.py              # FastAPI application & endpoints
│   ├── converters.py        # Conversion logic for all formats
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container configuration
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application component (812 lines)
│   │   ├── api.ts           # API client with URL resolution
│   │   ├── main.tsx         # React entry point
│   │   ├── App.css          # Styles with animations
│   │   └── components/      # Reusable UI components
│   ├── public/
│   │   └── favicon.svg      # Custom brand icon
│   ├── Dockerfile           # Frontend container configuration
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration
├── docker-compose.yml       # Container orchestration
└── README.md               # This file
\`\`\`

---

## 🚀 Quick Start

### Prerequisites
- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Git** for cloning the repository

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/Manicoder-code/online-document-converter.git
   cd online-document-converter
   \`\`\`

2. **Start the application**
   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. **Access the application**
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000
   - **API Docs:** http://localhost:8000/docs

That's it! The application is now running with all features enabled.

### Stopping the Application
\`\`\`bash
docker-compose down
\`\`\`

To remove all data and start fresh:
\`\`\`bash
docker-compose down -v
docker system prune -af
\`\`\`

---

## 🎬 Demo

### Home Page
- Professional landing page with feature showcase
- Conversion tools grid with 6 main tools
- "Why Choose Us" benefits section
- "How It Works" step-by-step guide
- 100+ format combinations display

### Convert Page
- Drag & drop file upload
- Dynamic format selection based on uploaded file
- Real-time conversion with progress indicators
- Automatic download on completion

### Merge PDF
- Multi-file selection interface
- File list with remove capability
- Combine multiple PDFs into one

### Split PDF
- Single file upload
- Page range input (e.g., "1-3,5,7-9")
- Extract specific pages or ranges

### Compress PDF
- Quality selection (low, medium, high)
- File size reduction while maintaining quality
- Optimized Ghostscript settings

---

## 📡 API Endpoints

### Document Conversion
\`\`\`http
POST /convert
Content-Type: multipart/form-data

Parameters:
  - file: File (required)
  - target_format: string (required) - pdf, docx, xlsx, pptx, doc, xls, ppt, jpg, png

Returns: Converted file (binary)
\`\`\`

### PDF Merge
\`\`\`http
POST /merge
Content-Type: multipart/form-data

Parameters:
  - files: File[] (multiple files, min 2)

Returns: Merged PDF file
\`\`\`

### PDF Split
\`\`\`http
POST /split
Content-Type: multipart/form-data

Parameters:
  - file: File (required)
  - page_ranges: string (required) - e.g., "1-3,5,7-9"

Returns: Split PDF file or ZIP (if multiple ranges)
\`\`\`

### PDF Compress
\`\`\`http
POST /compress
Content-Type: multipart/form-data

Parameters:
  - file: File (required)
  - quality: string (required) - low, medium, high

Returns: Compressed PDF file
\`\`\`

### Health Check
\`\`\`http
GET /health

Returns: { "status": "healthy" }
\`\`\`

### API Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🌐 Deployment

### Production Deployment (EC2, VPS, Cloud)

1. **Clone on server**
   \`\`\`bash
   git clone https://github.com/yourusername/online-document-converter.git
   cd online-document-converter
   \`\`\`

2. **Build and run**
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`

3. **Configure reverse proxy (Nginx)**
   \`\`\`nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api/ {
           proxy_pass http://localhost:8000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   \`\`\`

4. **Enable SSL with Let's Encrypt**
   \`\`\`bash
   sudo certbot --nginx -d yourdomain.com
   \`\`\`

### Environment Variables

Create `.env` file in root directory:
\`\`\`env
# Backend
BACKEND_PORT=8000
MAX_FILE_SIZE=26214400  # 25MB in bytes

# Frontend
VITE_API_URL=http://your-domain.com:8000
\`\`\`

---

## 🔧 Local Development

### Without Docker

#### Backend Setup
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y libreoffice ghostscript imagemagick

# Start backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

#### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

---

## 📊 Supported Conversions

| Source Format | Target Formats |
|--------------|----------------|
| **PDF** | DOCX, XLSX, PPTX, JPG, PNG |
| **Word (DOC/DOCX)** | PDF, XLSX, XLS, PPTX, PPT, JPG, PNG |
| **Excel (XLS/XLSX)** | PDF, DOCX, DOC, PPTX, PPT, JPG, PNG |
| **PowerPoint (PPT/PPTX)** | PDF, DOCX, DOC, XLSX, XLS, JPG, PNG |
| **Images (JPG/PNG)** | PDF, opposite format |

**Total:** 100+ format combinations supported

---

## 🔐 Security Features

- ✅ File size validation (25MB limit)
- ✅ File type validation (whitelist-based)
- ✅ Automatic file cleanup after processing
- ✅ No persistent file storage
- ✅ CORS configuration for API security
- ✅ Input sanitization on all endpoints
- ✅ Background task cleanup for failed conversions
- ✅ Temporary directory isolation

---

## 🐛 Troubleshooting

### Frontend not connecting to backend
- Check if backend is running: `curl http://localhost:8000/health`
- Verify CORS settings in `backend/main.py`
- Check browser console for errors

### Conversion fails
- Verify LibreOffice is installed: `docker exec -it doc-converter-backend libreoffice --version`
- Check backend logs: `docker logs doc-converter-backend`
- Ensure file format is supported

### Docker build fails
- Clean Docker cache: `docker system prune -af`
- Rebuild: `docker-compose up --build --force-recreate`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@Manicoder-code](https://github.com/Manicoder-code)
- Email: manikandan.r.devops@gmail.com

---

## 🙏 Acknowledgments

- LibreOffice for the powerful conversion engine
- FastAPI for the excellent web framework
- React team for the amazing frontend library
- All open-source contributors

---

<div align="center">

**Made with ❤️ by developers, for developers**

⭐ Star this repo if you find it helpful!

</div>

MIT

