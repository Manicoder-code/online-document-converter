import { useState, useRef, useMemo } from "react";
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
  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<SupportedTargetFormat>("pdf");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);

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

    if (availableFormats.length === 0) {
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'this file';
      setError(`Sorry, ${fileExt} format is not supported for conversion yet.`);
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
      }, 3000);
    } catch (err: any) {
      console.error("Conversion error:", err);
      setError(err.message || "Conversion failed. Please make sure the backend is running.");
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
    setSuccess(false);

    try {
      const blob = await mergePDFs(files);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
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
    if (!file) {
      setError("Please select a PDF file to split.");
      return;
    }

    // Prompt user for page ranges
    const pageRanges = prompt("Enter page ranges to split (e.g., '1-3,5,7-9'):");
    if (!pageRanges) {
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      const blob = await splitPDF(file, pageRanges);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Check if it's a ZIP by checking blob type
      if (blob.type.includes("zip")) {
        a.download = "split_pdfs.zip";
      } else {
        a.download = file.name.replace(".pdf", "_split.pdf");
      }
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during PDF split.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleCompressPDF = async () => {
    if (!file) {
      setError("Please select a PDF file to compress.");
      return;
    }

    // Prompt user for quality
    const quality = prompt("Enter compression quality (low, medium, high):", "medium");
    if (!quality) {
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccess(false);

    try {
      const blob = await compressPDF(file, quality);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during PDF compression.");
    } finally {
      setIsConverting(false);
    }
  };

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
                <div className="files-list" onClick={(e) => e.stopPropagation()}>
                  <div className="upload-text" style={{marginBottom: '16px', fontSize: '1.1rem'}}>{files.length} files selected</div>
                  {files.map((f, idx) => (
                    <div key={idx} className="file-item">
                      <span>📄 {f.name}</span>
                      <button
                        className="remove-file-btn"
                        onClick={() => setFiles(files.filter((_, i) => i !== idx))}
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
          </div>
        );

      case "split":
        return (
          <div className="card">
            <h2 className="page-title">Split PDF File</h2>
            <p className="page-subtitle">Extract pages from your PDF document</p>
            
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
                accept=".pdf"
              />
              
              {!file ? (
                <>
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="upload-text">Drag & drop your PDF here</div>
                  <div className="upload-hint">or</div>
                  <button type="button" className="upload-button">Choose File</button>
                </>
              ) : (
                <div className="file-display" onClick={(e) => e.stopPropagation()}>
                  <div className="file-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="remove-button">
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleSplitPDF} disabled={isConverting || !file} className="convert-button" style={{ marginTop: '24px' }}>
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
          </div>
        );

      case "compress":
        return (
          <div className="card">
            <h2 className="page-title">Compress PDF File</h2>
            <p className="page-subtitle">Reduce PDF file size while maintaining quality</p>
            
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
                accept=".pdf"
              />
              
              {!file ? (
                <>
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="upload-text">Drag & drop your PDF here</div>
                  <div className="upload-hint">or</div>
                  <button type="button" className="upload-button">Choose File</button>
                </>
              ) : (
                <div className="file-display" onClick={(e) => e.stopPropagation()}>
                  <div className="file-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="remove-button">
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleCompressPDF} disabled={isConverting || !file} className="convert-button" style={{ marginTop: '24px' }}>
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
                    <button type="button" className="upload-button" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
                      Choose File
                    </button>
                  </>
                ) : (
                  <div className="file-display" onClick={(e) => e.stopPropagation()}>
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
                    onChange={(e) => setTargetFormat(e.target.value as SupportedTargetFormat)}
                    className="format-select"
                  >
                    {availableFormats.map((format) => (
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

      default: // home
        return null;
    }
  };

  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => setActivePage("home")}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <rect x="20" y="30" width="25" height="35" rx="3" fill="#4299e1"/>
              <path d="M 50 45 L 60 45 L 60 40 L 70 50 L 60 60 L 60 55 L 50 55 Z" fill="#48bb78"/>
              <rect x="55" y="30" width="25" height="35" rx="3" fill="#4299e1"/>
            </svg>
            <span>PDF Tools</span>
          </div>
          <div className="navbar-menu">
            <a onClick={() => setActivePage("home")} className={`navbar-link ${activePage === "home" ? "active" : ""}`}>Home Page</a>
            <a onClick={() => setActivePage("merge")} className={`navbar-link ${activePage === "merge" ? "active" : ""}`}>Merge PDF</a>
            <a onClick={() => setActivePage("split")} className={`navbar-link ${activePage === "split" ? "active" : ""}`}>Split PDF</a>
            <a onClick={() => setActivePage("compress")} className={`navbar-link ${activePage === "compress" ? "active" : ""}`}>Compress PDF</a>
            <a onClick={() => setActivePage("convert")} className={`navbar-link ${activePage === "convert" ? "active" : ""}`}>Convert PDF</a>
            <div className="navbar-dropdown">
              <button className="navbar-link dropdown-toggle">
                All PDF tools
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div className="dropdown-menu">
                <a onClick={() => setActivePage("convert")}>PDF to Word</a>
                <a onClick={() => setActivePage("convert")}>PDF to Excel</a>
                <a onClick={() => setActivePage("convert")}>PDF to PowerPoint</a>
                <a onClick={() => setActivePage("convert")}>PDF to JPG</a>
                <a onClick={() => setActivePage("convert")}>Word to PDF</a>
                <a onClick={() => setActivePage("convert")}>Excel to PDF</a>
              </div>
            </div>
          </div>
          <div className="navbar-actions">
            <button className="navbar-btn login">Login</button>
            <button className="navbar-btn signup">Sign up</button>
          </div>
        </div>
      </nav>

      <div className="container">
        {activePage === "home" && (
          <>
            <div className="header">
              <h1 className="title">Every tool you need to work with documents</h1>
              <p className="subtitle">All your document conversion needs in one place. 100% FREE and easy to use!</p>
            </div>

            {/* Features Grid */}
            <div className="features-section">
              <h2 className="section-title">Popular Conversion Tools</h2>
              <div className="tools-grid">
                <div className="tool-card" onClick={() => setActivePage("convert")}>
                  <div className="tool-icon">📄</div>
                  <h3>PDF to Word</h3>
                  <p>Convert PDF files to editable Word documents with high accuracy</p>
                </div>
                <div className="tool-card" onClick={() => setActivePage("convert")}>
                  <div className="tool-icon">📊</div>
                  <h3>PDF to Excel</h3>
                  <p>Extract data from PDF into Excel spreadsheets quickly</p>
                </div>
                <div className="tool-card" onClick={() => setActivePage("merge")}>
                  <div className="tool-icon">🔗</div>
                  <h3>Merge PDF</h3>
                  <p>Combine multiple PDF files into one document easily</p>
                </div>
                <div className="tool-card" onClick={() => setActivePage("split")}>
                  <div className="tool-icon">✂️</div>
                  <h3>Split PDF</h3>
                  <p>Extract pages from PDF documents quickly</p>
                </div>
                <div className="tool-card" onClick={() => setActivePage("compress")}>
                  <div className="tool-icon">📦</div>
                  <h3>Compress PDF</h3>
                  <p>Reduce PDF file size while maintaining quality</p>
                </div>
                <div className="tool-card" onClick={() => setActivePage("convert")}>
                  <div className="tool-icon">📑</div>
                  <h3>Excel to PDF</h3>
                  <p>Convert spreadsheets to PDF format for easy sharing</p>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="benefits-section">
              <h2 className="section-title">Why Choose Our Converter?</h2>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon">🚀</div>
                  <h3>Fast & Easy</h3>
                  <p>Convert documents in seconds with our powerful conversion engine</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🔒</div>
                  <h3>100% Secure</h3>
                  <p>Your files are automatically deleted after conversion. Privacy guaranteed</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">✨</div>
                  <h3>High Quality</h3>
                  <p>Maintain formatting and quality with advanced conversion algorithms</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">💯</div>
                  <h3>100% Free</h3>
                  <p>No hidden fees, no registration required. Convert unlimited files</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🌐</div>
                  <h3>Works Everywhere</h3>
                  <p>Use on any device with a browser - Windows, Mac, Linux, mobile</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">⚡</div>
                  <h3>No Installation</h3>
                  <p>Online converter - no software to download or install</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="how-it-works">
              <h2 className="section-title">How It Works</h2>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <h3>Upload File</h3>
                  <p>Select or drag & drop your document</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <h3>Choose Format</h3>
                  <p>Pick the format you want to convert to</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <h3>Download</h3>
                  <p>Get your converted file instantly</p>
                </div>
              </div>
            </div>

            {/* Supported Formats */}
            <div className="formats-section">
              <h2 className="section-title">100+ Format Combinations Supported</h2>
              <div className="format-categories">
                <div className="format-category">
                  <h3>From PDF</h3>
                  <div className="format-list">
                    <span className="format-tag">Word (DOC, DOCX)</span>
                    <span className="format-tag">Excel (XLS, XLSX)</span>
                    <span className="format-tag">PowerPoint (PPT, PPTX)</span>
                    <span className="format-tag">Images (JPG, PNG)</span>
                  </div>
                </div>
                <div className="format-category">
                  <h3>To PDF</h3>
                  <div className="format-list">
                    <span className="format-tag">Word Documents</span>
                    <span className="format-tag">Excel Spreadsheets</span>
                    <span className="format-tag">PowerPoint Slides</span>
                    <span className="format-tag">Images (JPG, PNG)</span>
                  </div>
                </div>
                <div className="format-category">
                  <h3>Office Formats</h3>
                  <div className="format-list">
                    <span className="format-tag">Word ↔ Excel</span>
                    <span className="format-tag">Word ↔ PowerPoint</span>
                    <span className="format-tag">Excel ↔ PowerPoint</span>
                    <span className="format-tag">All to Images</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activePage !== "home" && renderToolPage()}

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Document Converter</h4>
              <p>The easiest way to convert documents online. Free, fast, and secure.</p>
            </div>
            <div className="footer-section">
              <h4>Tools</h4>
              <ul>
                <li onClick={() => setActivePage("convert")}>PDF Converter</li>
                <li onClick={() => setActivePage("merge")}>Merge PDF</li>
                <li onClick={() => setActivePage("split")}>Split PDF</li>
                <li onClick={() => setActivePage("compress")}>Compress PDF</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Document Converter. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

