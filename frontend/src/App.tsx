import { useState, useRef, useMemo } from "react";
import { convertDocument, SupportedTargetFormat } from "./api";

// Map of what each file type can convert TO
const SUPPORTED_CONVERSIONS: Record<string, SupportedTargetFormat[]> = {
  // PDF can convert to all office formats and images
  pdf: ["docx", "xlsx", "pptx", "jpg", "png"],
  
  // Word documents can convert to all formats
  doc: ["pdf", "docx", "xlsx", "xls", "pptx", "ppt", "jpg", "png"],
  docx: ["pdf", "doc", "xlsx", "xls", "pptx", "ppt", "jpg", "png"],
  
  // Excel documents can convert to all formats
  xls: ["pdf", "xlsx", "docx", "doc", "pptx", "ppt", "jpg", "png"],
  xlsx: ["pdf", "xls", "docx", "doc", "pptx", "ppt", "jpg", "png"],
  
  // PowerPoint documents can convert to all formats
  ppt: ["pdf", "pptx", "docx", "doc", "xlsx", "xls", "jpg", "png"],
  pptx: ["pdf", "ppt", "docx", "doc", "xlsx", "xls", "jpg", "png"],
  
  // Images can convert to other image formats and PDF
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get available formats based on uploaded file
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
    
    // Auto-select first available format for the uploaded file
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
    event.currentTarget.classList.remove('border-red-400', 'bg-red-50');
    event.currentTarget.classList.add('border-gray-300');
    const droppedFile = event.dataTransfer.files?.[0] || null;
    setFile(droppedFile);
    setError(null);
    setSuccess(false);
    
    // Auto-select first available format for the dropped file
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
    event.currentTarget.classList.remove('border-gray-300');
    event.currentTarget.classList.add('border-red-400', 'bg-red-50');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-red-400', 'bg-red-50');
    event.currentTarget.classList.add('border-gray-300');
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

    // Check if file format is supported
    if (availableFormats.length === 0) {
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'this file';
      setError(`Sorry, ${fileExt} format is not supported for conversion yet.`);
      return;
    }

    // Check if trying to convert to same format
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
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      link.download = `${originalName}.${targetFormat}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess(true);
      
      // Reset form after a delay
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Document Converter</h1>
                <p className="text-xs text-gray-500">Convert files online for free</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-sm text-gray-600 hover:text-gray-900">Tools</button>
              <button className="text-sm text-gray-600 hover:text-gray-900">Pricing</button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Convert Documents Online
          </h2>
          <p className="text-lg text-gray-600">
            Fast, free, and secure document conversion. No registration required.
          </p>
        </div>

        {/* Conversion Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit}>
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center transition-all cursor-pointer hover:border-red-400 hover:bg-gray-50"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleBrowseClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              
              {!file ? (
                <>
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Choose a file or drag it here
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG
                  </p>
                  <button
                    type="button"
                    className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
                    Select File
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Format Selection */}
            {file && (
              <div className="mt-8 space-y-4">
                {availableFormats.length > 0 ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">
                        Convert to:
                      </span>
                      <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value as SupportedTargetFormat)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                      >
                        {availableFormats.map((format) => (
                          <option key={format} value={format}>
                            {FORMAT_LABELS[format]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-yellow-800">This file format cannot be converted yet.</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm text-green-800">File converted and downloaded successfully!</p>
                    </div>
                  </div>
                )}

                {/* Convert Button */}
                <button
                  type="submit"
                  disabled={isConverting || !file || availableFormats.length === 0}
                  className="w-full py-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  {isConverting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Converting...
                    </span>
                  ) : (
                    "Convert File"
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">Files are automatically deleted after conversion</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast</h3>
            <p className="text-sm text-gray-600">Quick conversion powered by modern technology</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy to Use</h3>
            <p className="text-sm text-gray-600">Simple drag and drop interface</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2024 Document Converter. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;


