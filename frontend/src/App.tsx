import React, { useState, useRef, useMemo, useEffect } from "react";
import AuthForm from "./components/AuthForm";
import { convertDocument, mergePDFs, splitPDF, compressPDF, SupportedTargetFormat } from "./api";
import "./App.css";

type ActivePage = "home" | "merge" | "split" | "compress" | "convert";

const SUPPORTED_CONVERSIONS: Record<string, SupportedTargetFormat[]> = {
  pdf: ["docx", "xlsx", "pptx", "jpg", "png"],
  doc: ["pdf", "docx", "xlsx", "xls", "pptx", "ppt", "jpg", "png"],
  docx: ["pdf", "doc", "xlsx", "xls", "pptx", "ppt", "jpg", "png"],
  xls: ["pdf", "xlsx", "docx", "doc", "pptx", "ppt", "jpg", "png"],
  xlsx: ["pdf", "xls", "docx", "doc", "pptx", "ppt", "jpg", "png"],
  ppt: ["pdf", "pptx", "docx", "doc", "xlsx", "xls", "jpg", "png"],
  pptx: ["pdf", "ppt", "docx", "doc", "xlsx", "xls", "jpg", "png"],
  jpg: ["png", "pdf"],
  jpeg: ["png", "pdf"],
  png: ["jpg", "pdf"],
};

const FORMAT_LABELS: Record<SupportedTargetFormat, string> = {
  pdf: "PDF Document",
  doc: "Word 97-2003 (DOC)",
  docx: "Word Document (DOCX)",
  ppt: "PowerPoint 97-2003 (PPT)",
  pptx: "PowerPoint (PPTX)",
  xls: "Excel 97-2003 (XLS)",
  xlsx: "Excel (XLSX)",
  jpg: "JPG Image",
  png: "PNG Image",
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<"main" | "dashboard">("main");
  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<SupportedTargetFormat>("pdf");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageRanges, setPageRanges] = useState<string>("1-3");
  const [compressQuality, setCompressQuality] = useState<string>("medium");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const splitFileInputRef = useRef<HTMLInputElement | null>(null);
  const compressFileInputRef = useRef<HTMLInputElement | null>(null);

  const availableFormats = useMemo(() => {
    if (!file) return [];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_CONVERSIONS[fileExt] || [];
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const available = SUPPORTED_CONVERSIONS[fileExt] || [];
      if (available.length > 0) {
        setTargetFormat(available[0]);
      }
    }
  };

  const handleMultiFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    setError(null);
    setSuccess(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0] || null;
    setFile(droppedFile);
    setError(null);
    setSuccess(false);
    if (droppedFile) {
      const fileExt = droppedFile.name.split('.').pop()?.toLowerCase() || '';
      const available = SUPPORTED_CONVERSIONS[fileExt] || [];
      if (available.length > 0) {
        setTargetFormat(available[0]);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a file to convert.");
      return;
    }
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === targetFormat) {
      setError(`Cannot convert ${fileExt.toUpperCase()} to ${targetFormat.toUpperCase()}. Please select a different format.`);
      return;
    }
    setIsConverting(true);
    setError(null);
    setSuccess(false);
    try {
      const blob = await convertDocument(file, targetFormat);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      link.download = `${originalName}.${targetFormat}`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (err: any) {
      setError("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleMergePDF = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }
    setIsConverting(true);
    setError(null);
    try {
      const blob = await mergePDFs(files);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      setFiles([]);
      if (multiFileInputRef.current) {
        multiFileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during PDF merge.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleSplitPDF = async () => {
    const splitFile = splitFileInputRef.current?.files?.[0];
    if (!splitFile) {
      setError("Please select a PDF file to split.");
      return;
    }
    if (!pageRanges.trim()) {
      setError("Please enter page ranges (e.g., 1-3,5,7-9).");
      return;
    }
    setIsConverting(true);
    setError(null);
    setSuccess(false);
    try {
      const blob = await splitPDF(splitFile, pageRanges);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "split.pdf";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      setSuccess(true);
      if (splitFileInputRef.current) {
        splitFileInputRef.current.value = "";
      }
      setPageRanges("1-3");
    } catch (err: any) {
      setError(err.message || "An error occurred during PDF split.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleCompressPDF = async () => {
    const compressFile = compressFileInputRef.current?.files?.[0];
    if (!compressFile) {
      setError("Please select a PDF file to compress.");
      return;
    }
    setIsConverting(true);
    setError(null);
    setSuccess(false);
    try {
      const blob = await compressPDF(compressFile, compressQuality);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "compressed.pdf";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      setSuccess(true);
      if (compressFileInputRef.current) {
        compressFileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during PDF compression.");
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("main");
    }
  }, [authToken]);

  const renderToolPage = () => {
    switch (activePage) {
      case "merge":
        return (
          <div className="card">
            <h2 className="page-title">Merge PDF Files</h2>
            <p className="page-subtitle">Combine multiple PDF files into one document</p>
            <div className="upload-area" onClick={() => multiFileInputRef.current?.click()}>
              <input
                ref={multiFileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleMultiFileChange}
                accept=".pdf"
                multiple
              />
              {files.length === 0 ? (
                <>
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="upload-text">Select PDF files to merge</div>
                  <div className="upload-hint">Click to select multiple files</div>
                  <button type="button" className="upload-button">Choose Files</button>
                </>
              ) : (
                <div className="files-list" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                  <div className="upload-text" style={{marginBottom: '16px', fontSize: '1.1rem'}}>{files.length} files selected</div>
                  {files.map((f: File, idx: number) => (
                    <div key={idx} className="file-item">
                      <span>📄 {f.name}</span>
                      <button
                        className="remove-file-btn"
                        onClick={() => setFiles(files.filter((_: File, i: number) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleMergePDF}
              disabled={isConverting || files.length < 2}
              className="convert-button"
              style={{ marginTop: '24px' }}
            >
              {isConverting ? "Merging..." : "Merge PDF Files"}
            </button>
            {error && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                PDFs merged successfully!
              </div>
            )}
          </div>
        );

      case "split":
        return (
          <div className="card">
            <h2 className="page-title">Split PDF File</h2>
            <p className="page-subtitle">Extract pages from your PDF document</p>
            <div className="upload-area" onClick={() => splitFileInputRef.current?.click()}>
              <input
                ref={splitFileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf"
              />
              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="upload-text">Select a PDF file to split</div>
              <div className="upload-hint">Click to select file</div>
              <button type="button" className="upload-button">Choose File</button>
            </div>
            <div style={{ marginTop: '24px' }}>
              <label className="form-label">Page Ranges (e.g., 1-3,5,7-9):</label>
              <input
                type="text"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
                className="format-select"
                placeholder="1-3,5,7-9"
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
            <button
              onClick={handleSplitPDF}
              disabled={isConverting}
              className="convert-button"
              style={{ marginTop: '24px' }}
            >
              {isConverting ? "Splitting..." : "Split PDF"}
            </button>
            {error && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                PDF split successfully!
              </div>
            )}
          </div>
        );

      case "compress":
        return (
          <div className="card">
            <h2 className="page-title">Compress PDF File</h2>
            <p className="page-subtitle">Reduce PDF file size while maintaining quality</p>
            <div className="upload-area" onClick={() => compressFileInputRef.current?.click()}>
              <input
                ref={compressFileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf"
              />
              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="upload-text">Select a PDF file to compress</div>
              <div className="upload-hint">Click to select file</div>
              <button type="button" className="upload-button">Choose File</button>
            </div>
            <div style={{ marginTop: '24px' }}>
              <label className="form-label">Compression Quality:</label>
              <select
                value={compressQuality}
                onChange={(e) => setCompressQuality(e.target.value)}
                className="format-select"
                style={{ width: '100%', marginTop: '8px' }}
              >
                <option value="low">Low (Smallest file size)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Best quality)</option>
              </select>
            </div>
            <button
              onClick={handleCompressPDF}
              disabled={isConverting}
              className="convert-button"
              style={{ marginTop: '24px' }}
            >
              {isConverting ? "Compressing..." : "Compress PDF"}
            </button>
            {error && (
              <div className="alert alert-error">
                <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                PDF compressed successfully!
              </div>
            )}
          </div>
        );

      case "convert":
        return (
          <div className="card">
            <h2 className="page-title">Convert Documents</h2>
            <p className="page-subtitle">Convert between PDF, Word, Excel, PowerPoint, and images</p>
            <form onSubmit={handleSubmit}>
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleBrowseClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                {!file ? (
                  <>
                    <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="upload-text">Drag & drop your file here</div>
                    <div className="upload-hint">or</div>
                    <button type="button" className="upload-button" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleBrowseClick(); }}>
                      Choose File
                    </button>
                  </>
                ) : (
                  <div className="file-display" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                    <div className="file-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="file-details">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="remove-button"
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {file && availableFormats.length > 0 && (
                <div className="conversion-section">
                  <label className="form-label">Convert to:</label>
                  <select
                    value={targetFormat}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetFormat(e.target.value as SupportedTargetFormat)}
                    className="format-select"
                  >
                    {availableFormats.map((format: SupportedTargetFormat) => (
                      <option key={format} value={format}>
                        {FORMAT_LABELS[format]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" disabled={isConverting} className="convert-button">
                    {isConverting ? (
                      <>
                        <span className="spinner"></span>
                        Converting...
                      </>
                    ) : (
                      "Convert File"
                    )}
                  </button>
                </div>
              )}
              {error && (
                <div className="alert alert-error">
                  <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  File converted successfully!
                </div>
              )}
            </form>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setAuthModalOpen(false)}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                background: 'none', 
                border: 'none', 
                fontSize: '24px', 
                cursor: 'pointer',
                color: '#718096',
                padding: '4px 8px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
            <AuthForm
              mode={authMode}
              onAuthSuccess={(token: string) => {
                setAuthToken(token);
                setAuthModalOpen(false);
              }}
            />
            <div style={{ marginTop: 16, textAlign: "center" }}>
              {authMode === "login" ? (
                <span>Don't have an account? <button style={{ color: "#4299e1", background: "none", border: "none", cursor: "pointer" }} onClick={() => setAuthMode("signup")}>Sign up</button></span>
              ) : (
                <span>Already have an account? <button style={{ color: "#4299e1", background: "none", border: "none", cursor: "pointer" }} onClick={() => setAuthMode("login")}>Login</button></span>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="navbar-enhanced">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => setActivePage("home")}>
            <div className="logo-icon">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                <rect x="20" y="30" width="25" height="35" rx="3" fill="url(#logoGradient)"/>
                <path d="M 50 45 L 60 45 L 60 40 L 70 50 L 60 60 L 60 55 L 50 55 Z" fill="#48bb78"/>
                <rect x="55" y="30" width="25" height="35" rx="3" fill="url(#logoGradient)"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-title">DocConverter</span>
              <span className="logo-subtitle">Pro</span>
            </div>
          </div>
          <div className="navbar-menu">
            <a onClick={() => setActivePage("home")} className={`navbar-link ${activePage === "home" ? "active" : ""}`}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              Home
            </a>
            <a onClick={() => setActivePage("merge")} className={`navbar-link ${activePage === "merge" ? "active" : ""}`}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
              Merge
            </a>
            <a onClick={() => setActivePage("split")} className={`navbar-link ${activePage === "split" ? "active" : ""}`}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              Split
            </a>
            <a onClick={() => setActivePage("compress")} className={`navbar-link ${activePage === "compress" ? "active" : ""}`}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              Compress
            </a>
            <a onClick={() => setActivePage("convert")} className={`navbar-link ${activePage === "convert" ? "active" : ""}`}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>
              Convert
            </a>
          </div>
          <div className="navbar-actions">
            {authToken ? (
              <>
                <div className="user-info">
                  <div className="user-avatar">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                  </div>
                  <span className="user-name">User</span>
                </div>
                <button className="navbar-btn logout" onClick={() => { setAuthToken(null); setCurrentPage("main"); }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414 0L4 7.414 5.414 6l3.293 3.293L13.586 6 15 7.414z" clipRule="evenodd"/></svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="navbar-btn login" onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  Login
                </button>
                <button className="navbar-btn signup" onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/></svg>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container">
        {currentPage === "dashboard" ? (
          <div className="card" style={{ maxWidth: 600, margin: "48px auto", padding: 32 }}>
            <h2>Welcome to your Dashboard!</h2>
            <p style={{ marginTop: 16 }}>You are now signed in. Here you can access your account and manage documents.</p>
            <button className="convert-button" style={{ marginTop: 32 }} onClick={() => setCurrentPage("main")}>Go to Tools</button>
          </div>
        ) : (
          <>
            {activePage === "home" ? (
              <div>
                {/* Hero Section with Modern Gradient */}
                <div className="hero-section">
                  <div className="hero-content">
                    <div className="hero-badge">✨ Trusted by 100,000+ Users Worldwide</div>
                    <h1 className="hero-title">
                      Transform Your Documents
                      <span className="hero-gradient-text"> In Seconds</span>
                    </h1>
                    <p className="hero-subtitle">
                      Professional document conversion, compression, and management tools. 
                      Lightning-fast, secure, and completely free. No registration required.
                    </p>
                    <div className="hero-buttons">
                      <button className="hero-btn-primary" onClick={() => setActivePage("convert")}>
                        <span>🚀 Start Converting Free</span>
                      </button>
                      <button className="hero-btn-secondary" onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }}>
                        <span>📊 View All Tools</span>
                      </button>
                    </div>
                    <div className="hero-features">
                      <div className="hero-feature-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        <span>No File Size Limit</span>
                      </div>
                      <div className="hero-feature-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        <span>256-bit Encryption</span>
                      </div>
                      <div className="hero-feature-item">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        <span>Auto-Delete After 1 Hour</span>
                      </div>
                    </div>
                  </div>
                  <div className="hero-visual">
                    <div className="floating-card card-1">
                      <div className="card-icon">📄</div>
                      <div className="card-text">PDF</div>
                    </div>
                    <div className="floating-card card-2">
                      <div className="card-icon">📊</div>
                      <div className="card-text">Excel</div>
                    </div>
                    <div className="floating-card card-3">
                      <div className="card-icon">📝</div>
                      <div className="card-text">Word</div>
                    </div>
                    <div className="floating-card card-4">
                      <div className="card-icon">🖼️</div>
                      <div className="card-text">Image</div>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="stats-section">
                  <div className="stats-container">
                    <div className="stat-item">
                      <div className="stat-number">2.5M+</div>
                      <div className="stat-label">Files Converted</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">100K+</div>
                      <div className="stat-label">Happy Users</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">15+</div>
                      <div className="stat-label">File Formats</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">99.9%</div>
                      <div className="stat-label">Uptime</div>
                    </div>
                  </div>
                </div>

                {/* Tools Grid with Enhanced Design */}
                <div className="tools-section">
                  <div className="section-header">
                    <h2 className="section-title">Powerful Tools at Your Fingertips</h2>
                    <p className="section-subtitle">Everything you need for professional document management</p>
                  </div>
                  <div className="tools-grid">
                    <div className="tool-card-modern" onClick={() => setActivePage("convert")}>
                      <div className="tool-card-icon gradient-blue">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <h3 className="tool-card-title">Convert Documents</h3>
                      <p className="tool-card-desc">Transform files between PDF, Word, Excel, PowerPoint, and images instantly</p>
                      <div className="tool-card-badge">Most Popular</div>
                    </div>
                    <div className="tool-card-modern" onClick={() => setActivePage("merge")}>
                      <div className="tool-card-icon gradient-green">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="tool-card-title">Merge PDFs</h3>
                      <p className="tool-card-desc">Combine multiple PDF files into a single document with one click</p>
                    </div>
                    <div className="tool-card-modern" onClick={() => setActivePage("split")}>
                      <div className="tool-card-icon gradient-purple">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h4m-4 4h8" />
                        </svg>
                      </div>
                      <h3 className="tool-card-title">Split PDF</h3>
                      <p className="tool-card-desc">Extract specific pages or divide your PDF into multiple files</p>
                    </div>
                    <div className="tool-card-modern" onClick={() => setActivePage("compress")}>
                      <div className="tool-card-icon gradient-orange">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <h3 className="tool-card-title">Compress Files</h3>
                      <p className="tool-card-desc">Reduce file size while maintaining quality for easy sharing</p>
                    </div>
                  </div>
                </div>

                {/* Features Section with Modern Cards */}
                <div className="features-section">
                  <div className="section-header">
                    <h2 className="section-title">Why Choose Our Platform?</h2>
                    <p className="section-subtitle">Built for speed, security, and simplicity</p>
                  </div>
                  <div className="features-grid-modern">
                    <div className="feature-card-modern">
                      <div className="feature-icon">⚡</div>
                      <h3>Lightning Fast</h3>
                      <p>Process files in seconds with our optimized conversion engine. No waiting, no delays.</p>
                    </div>
                    <div className="feature-card-modern">
                      <div className="feature-icon">🔐</div>
                      <h3>Bank-Level Security</h3>
                      <p>256-bit SSL encryption protects your files. Automatic deletion after processing.</p>
                    </div>
                    <div className="feature-card-modern">
                      <div className="feature-icon">🎯</div>
                      <h3>100% Accurate</h3>
                      <p>Advanced algorithms ensure perfect formatting and layout preservation.</p>
                    </div>
                    <div className="feature-card-modern">
                      <div className="feature-icon">💎</div>
                      <h3>Always Free</h3>
                      <p>No subscriptions, no hidden fees. Unlimited conversions at no cost.</p>
                    </div>
                    <div className="feature-card-modern">
                      <div className="feature-icon">📱</div>
                      <h3>Any Device</h3>
                      <p>Works seamlessly on desktop, tablet, and mobile. Convert anywhere, anytime.</p>
                    </div>
                    <div className="feature-card-modern">
                      <div className="feature-icon">🌐</div>
                      <h3>No Installation</h3>
                      <p>Web-based platform works directly in your browser. No downloads required.</p>
                    </div>
                  </div>
                </div>

                {/* Supported Formats - Enhanced */}
                <div className="formats-section enhanced-formats-section" style={{ width: '100%', maxWidth: 1100, margin: '64px auto 48px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '4px solid #667eea', borderRadius: '24px', background: 'linear-gradient(180deg, #f7fafc 90%, #fff 100%)', boxShadow: '0 6px 32px 0 #667eea22', padding: '36px 0', boxSizing: 'border-box' }}>
                  <div className="section-header" style={{ textAlign: 'center', width: '100%', maxWidth: 900, margin: '0 auto 32px auto' }}>
                    <h2 className="section-title gradient-text" style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px' }}>Support for All Major Formats</h2>
                    <p className="section-subtitle" style={{ fontSize: '1.15rem', color: '#4a5568', marginBottom: 0 }}>Convert between <b>15+</b> file formats with ease and flexibility</p>
                  </div>
                  <div className="formats-showcase formats-row" style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '18px', marginTop: '0', flexWrap: 'nowrap', boxSizing: 'border-box' }}>
                    {[
                      { name: 'PDF', icon: '📄', color: '#e53e3e', desc: 'Portable Document Format' },
                      { name: 'Word', icon: '📝', color: '#2b6cb0', desc: 'DOC, DOCX' },
                      { name: 'Excel', icon: '📊', color: '#38a169', desc: 'XLS, XLSX' },
                      { name: 'PowerPoint', icon: '📽️', color: '#dd6b20', desc: 'PPT, PPTX' },
                      { name: 'JPG', icon: '🖼️', color: '#805ad5', desc: 'JPEG Image' },
                      { name: 'PNG', icon: '🎨', color: '#d69e2e', desc: 'PNG Image' }
                    ].map((format) => (
                      <div key={format.name} className="format-card" style={{ borderColor: format.color, boxShadow: `0 4px 16px 0 ${format.color}22`, flex: '0 0 120px', minWidth: '120px', maxWidth: '120px', background: 'linear-gradient(180deg, #f7fafc 80%, #fff 100%)', margin: '0', padding: '24px 8px 16px 8px', height: '100%' }}>
                        <div className="format-card-icon" style={{ color: format.color, fontSize: '2.7rem', marginBottom: '12px' }}>{format.icon}</div>
                        <div className="format-card-title" style={{ fontWeight: 700, fontSize: '1.18rem', marginBottom: '4px' }}>{format.name}</div>
                        <div className="format-card-desc" style={{ fontSize: '1.05rem', color: '#718096' }}>{format.desc}</div>
                      </div>
                    ))}
                  </div>
                  <style>{`
                    .enhanced-formats-section {
                      margin: 64px 0 48px 0;
                      width: 100%;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                    }
                    .formats-row {
                      display: flex;
                      flex-direction: row;
                      justify-content: center;
                      align-items: flex-start;
                      gap: 40px;
                      margin-top: 0;
                      width: 100%;
                      max-width: 900px;
                      margin-left: auto;
                      margin-right: auto;
                      flex-wrap: nowrap;
                    }
                    .format-card {
                      background: linear-gradient(180deg, #f7fafc 80%, #fff 100%);
                      border: 2.5px solid #e2e8f0;
                      border-radius: 18px;
                      padding: 28px 12px 18px 12px;
                      min-width: 120px;
                      max-width: 150px;
                      text-align: center;
                      transition: transform 0.18s, box-shadow 0.18s;
                      cursor: pointer;
                      position: relative;
                      flex: 0 0 140px;
                      margin: 0;
                    }
                    .format-card:hover {
                      transform: translateY(-8px) scale(1.04);
                      box-shadow: 0 8px 32px 0 #a0aec040;
                      border-color: #667eea;
                    }
                    .format-card-icon {
                      font-size: 2.3rem;
                      margin-bottom: 8px;
                      filter: drop-shadow(0 2px 8px #0001);
                    }
                    .format-card-title {
                      font-weight: 700;
                      font-size: 1.08rem;
                      margin-bottom: 2px;
                    }
                    .format-card-desc {
                      font-size: 0.95rem;
                      color: #718096;
                    }
                    .gradient-text {
                      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      background-clip: text;
                      text-fill-color: transparent;
                    }
                    @media (max-width: 900px) {
                      .formats-row {
                        gap: 18px;
                        max-width: 98vw;
                        flex-wrap: wrap;
                        justify-content: center;
                      }
                      .format-card {
                        padding: 18px 6px 10px 6px;
                        min-width: 90px;
                        max-width: 110px;
                        flex: 0 0 90px;
                      }
                      .format-card-icon {
                        font-size: 1.5rem;
                      }
                    }
                  `}</style>
                </div>

                {/* How It Works */}
                <div className="how-it-works-section">
                  <div className="section-header">
                    <h2 className="section-title" style={{ color: 'white' }}>How It Works</h2>
                    <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>Three simple steps to convert your files</p>
                  </div>
                  <div className="steps-container">
                    <div className="step-card">
                      <div className="step-number">1</div>
                      <div className="step-icon">📤</div>
                      <h3 className="step-title">Upload File</h3>
                      <p className="step-desc">Drag and drop or click to select your document from any device</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                      <div className="step-number">2</div>
                      <div className="step-icon">⚙️</div>
                      <h3 className="step-title">Choose Format</h3>
                      <p className="step-desc">Select your desired output format from our extensive list</p>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step-card">
                      <div className="step-number">3</div>
                      <div className="step-icon">📥</div>
                      <h3 className="step-title">Download</h3>
                      <p className="step-desc">Get your converted file instantly, ready to use</p>
                    </div>
                  </div>
                </div>

                {/* Format Combinations Section */}
                <div className="format-combinations-section">
                  <div className="section-header">
                    <h2 className="section-title">100+ Format Combinations Supported</h2>
                  </div>
                  <div className="format-grid">
                    <div className="format-column">
                      <h3 className="format-column-title">From PDF</h3>
                      <ul className="format-list">
                        <li>Word (DOC, DOCX)</li>
                        <li>Excel (XLS, XLSX)</li>
                        <li>PowerPoint (PPT, PPTX)</li>
                        <li>Images (JPG, PNG)</li>
                      </ul>
                    </div>
                    <div className="format-column">
                      <h3 className="format-column-title">To PDF</h3>
                      <ul className="format-list">
                        <li>Word Documents</li>
                        <li>Excel Spreadsheets</li>
                        <li>PowerPoint Slides</li>
                        <li>Images (JPG, PNG)</li>
                      </ul>
                    </div>
                    <div className="format-column">
                      <h3 className="format-column-title">Office Formats</h3>
                      <ul className="format-list">
                        <li>Word ↔ Excel</li>
                        <li>Word ↔ PowerPoint</li>
                        <li>Excel ↔ PowerPoint</li>
                        <li>All to Images</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              renderToolPage()
            )}
          </>
        )}
      </div>

      <footer className="footer-enhanced">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-column">
              <div className="footer-logo">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <rect x="20" y="30" width="25" height="35" rx="3" fill="url(#footerGradient)"/>
                  <path d="M 50 45 L 60 45 L 60 40 L 70 50 L 60 60 L 60 55 L 50 55 Z" fill="#48bb78"/>
                  <rect x="55" y="30" width="25" height="35" rx="3" fill="url(#footerGradient)"/>
                </svg>
                <span>DocConverter Pro</span>
              </div>
              <p className="footer-description">Professional online document conversion, compression, and management tools. Fast, secure, and completely free.</p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://github.com/Manicoder-code/online-document-converter" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Tools</h4>
              <ul className="footer-links">
                <li><a onClick={() => setActivePage("convert")}>Document Converter</a></li>
                <li><a onClick={() => setActivePage("merge")}>Merge PDF</a></li>
                <li><a onClick={() => setActivePage("split")}>Split PDF</a></li>
                <li><a onClick={() => setActivePage("compress")}>Compress PDF</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 DocConverter Pro. All rights reserved. | 
              <a 
                href="https://github.com/Manicoder-code/online-document-converter" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ marginLeft: '8px', color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
              >
                <svg 
                  style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '4px' }} 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </p>
            <div className="footer-badges">
              <span className="badge">🔒 SSL Secure</span>
              <span className="badge">⚡ Fast Processing</span>
              <span className="badge">✓ 100% Free</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default App;

