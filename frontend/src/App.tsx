import { useState, useRef, useMemo } from "react";
import { convertDocument, SupportedTargetFormat } from "./api";
import "./App.css";

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
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedTargetFormat>("pdf");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1 className="title">Every tool you need to convert documents</h1>
          <p className="subtitle">All your document conversion needs in one place. 100% FREE and easy to use!</p>
        </div>

        <div className="card">
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
                  <button
                    type="button"
                    className="upload-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
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

                <button
                  type="submit"
                  disabled={isConverting}
                  className="convert-button"
                >
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

        {/* Features Grid */}
        <div className="features-section">
          <h2 className="section-title">Popular Conversion Tools</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon">📄</div>
              <h3>PDF to Word</h3>
              <p>Convert PDF files to editable Word documents with high accuracy</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📊</div>
              <h3>PDF to Excel</h3>
              <p>Extract data from PDF into Excel spreadsheets quickly</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🎨</div>
              <h3>PDF to PowerPoint</h3>
              <p>Turn PDF files into editable PowerPoint presentations</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🖼️</div>
              <h3>PDF to Image</h3>
              <p>Convert PDF pages to JPG or PNG images instantly</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📝</div>
              <h3>Word to PDF</h3>
              <p>Make DOC and DOCX files easy to read by converting to PDF</p>
            </div>
            <div className="tool-card">
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
                <li>PDF Converter</li>
                <li>Word Converter</li>
                <li>Excel Converter</li>
                <li>Image Converter</li>
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
            <p>© 2024 Document Converter. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

