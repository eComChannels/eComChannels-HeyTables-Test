/**
 * Constants for file types accepted for upload
 */

export const ACCEPTED_FILE_TYPES = {
  // Images
  images: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml',
  
  // Videos
  videos: 'video/mp4,video/mpeg,video/webm,video/ogg,video/quicktime',
  
  // Documents
  documents: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/rtf',
  
  // Combined types for file input accept attribute
  all: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,video/mp4,video/mpeg,video/webm,video/ogg,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/rtf'
};

// Extensions for user-friendly display and file type validation
export const FILE_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'],
  videos: ['.mp4', '.mpeg', '.webm', '.ogg', '.mov'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf']
};

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; 