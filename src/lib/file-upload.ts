/**
 * File upload utilities
 */

export interface FileItem {
  id: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

/**
 * Convert legacy document strings (filenames) to FileItem objects
 */
export function convertDocumentsToFiles(documents: string[]): FileItem[] {
  return documents.map((doc, index) => ({
    id: `file-${index}-${Date.now()}`,
    name: doc,
    url: undefined, // Legacy attachments don't have URLs
    size: undefined,
    type: getFileType(doc),
    uploadedAt: undefined,
  }));
}

/**
 * Get file type from filename extension
 */
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const typeMap: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  
  return typeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
