"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { useSystemSettings } from "@/context/SystemSettingsContext";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  label?: string;
  description?: string;
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMB,
  acceptedTypes = ["image/*", ".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  label = "Upload Files",
  description = "Drag and drop files here, or click to browse",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import system settings to get max file size
  const { settings } = useSystemSettings();
  const effectiveMaxSizeMB = maxSizeMB ?? settings.maxFileSize;
  const maxSizeBytes = effectiveMaxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeBytes) {
      return `File "${file.name}" exceeds ${effectiveMaxSizeMB}MB limit`;
    }

    // Check file count
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          resolve(undefined);
        };
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setError("");
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        break;
      }

      // Create preview for images
      const preview = await createFilePreview(file);

      // Create uploaded file object
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        preview,
      };

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
    setError("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon size={20} className="text-blue-500" />;
    }
    return <FileText size={20} className="text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-[#CC1F1A] bg-red-50/50 scale-[1.02]"
              : "border-gray-300 hover:border-[#CC1F1A] hover:bg-slate-50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`
            w-16 h-16 rounded-full flex items-center justify-center
            transition-colors duration-200
            ${isDragging ? "bg-[#CC1F1A]" : "bg-slate-100"}
          `}
          >
            <Upload
              size={28}
              className={isDragging ? "text-white" : "text-slate-600"}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0E2271] mb-1">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Max {maxFiles} files • {effectiveMaxSizeMB}MB per file
            </p>
            <p className="text-[10px]">
              Supported: Images, PDF, Word, Excel documents
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Uploaded Files ({files.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors group"
              >
                {/* Preview or Icon */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <Image
                      src={file.preview}
                      alt={file.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-md border border-border"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-md">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="flex-shrink-0 p-1.5 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
