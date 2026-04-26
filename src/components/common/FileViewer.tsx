"use client";

import { useState } from "react";
import { FileText, Download, Eye, Image as ImageIcon, FileArchive, File } from "lucide-react";
import { FileItem, isImageFile, formatFileSize } from "@/lib/file-upload";

interface FileViewerProps {
  files: FileItem[];
  title?: string;
  showDownload?: boolean;
  showPreview?: boolean;
  emptyMessage?: string;
}

export function FileViewer({
  files,
  title = "Attachments",
  showDownload = true,
  showPreview = true,
  emptyMessage = "No files attached",
}: FileViewerProps) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  if (files.length === 0) {
    return (
      <div>
        {title && (
          <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
            {title}
          </h3>
        )}
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const getFileIcon = (file: FileItem) => {
    const name = file.name.toLowerCase();
    
    if (isImageFile(name)) {
      return <ImageIcon size={16} className="text-blue-500" />;
    }
    
    if (name.endsWith('.pdf')) {
      return <FileText size={16} className="text-red-500" />;
    }
    
    if (name.match(/\.(zip|rar|7z)$/)) {
      return <FileArchive size={16} className="text-amber-500" />;
    }
    
    if (name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/)) {
      return <FileText size={16} className="text-blue-600" />;
    }
    
    return <File size={16} className="text-gray-500" />;
  };

  const handleDownload = (file: FileItem) => {
    if (file.url) {
      // If we have a URL, download from there
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Legacy files without URLs - show message
      alert(`File "${file.name}" is not available for download. This is a legacy attachment reference.`);
    }
  };

  const handlePreview = (file: FileItem) => {
    if (file.url && isImageFile(file.name)) {
      setPreviewFile(file);
    } else if (file.url) {
      // Open in new tab for non-images
      window.open(file.url, '_blank');
    } else {
      alert(`Preview not available for "${file.name}". This is a legacy attachment reference.`);
    }
  };

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-[#0E2271] mb-3">
          {title}
        </h3>
      )}
      
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 bg-slate-100 p-2 rounded-md">
                {getFileIcon(file)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                {file.size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {showPreview && isImageFile(file.name) && (
                <button
                  onClick={() => handlePreview(file)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0E2271] transition-colors flex items-center gap-1.5"
                  title="Preview"
                >
                  <Eye size={14} />
                  Preview
                </button>
              )}
              {showDownload && (
                <button
                  onClick={() => handleDownload(file)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#CC1F1A] hover:bg-[#A01915] text-white transition-colors flex items-center gap-1.5"
                  title="Download"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewFile && isImageFile(previewFile.name) && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm font-medium">{previewFile.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
