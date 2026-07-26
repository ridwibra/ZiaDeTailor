// utils/files/validateFileFormat.ts

import fs from "fs/promises";

type UploadFile = {
  mimetype: string;
  size: number;
  tempFilePath?: string;
  name?: string;
};

type ValidationResult = {
  valid: boolean;
  message?: string;
};

// Explicitly type the allowed formats
type ImageMimeType =
  | "image/jpeg"
  | "image/jpg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/svg+xml"
  | "image/bmp"
  | "image/tiff";

type VideoMimeType =
  | "video/mp4"
  | "video/quicktime"
  | "video/x-msvideo"
  | "video/x-ms-wmv"
  | "video/x-flv"
  | "video/webm"
  | "video/x-matroska"
  | "video/ogg";

type AudioMimeType =
  | "audio/mpeg"
  | "audio/wav"
  | "audio/aac"
  | "audio/ogg"
  | "audio/flac"
  | "audio/x-m4a";

type DocumentMimeType =
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "application/pdf"
  | "text/plain"
  | "text/html";

const ALLOWED_IMAGE_FORMATS: ImageMimeType[] = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

const ALLOWED_VIDEO_FORMATS: VideoMimeType[] = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/webm",
  "video/x-matroska",
  "video/ogg",
];

const ALLOWED_AUDIO_FORMATS: AudioMimeType[] = [
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
];

const ALLOWED_DOCUMENT_FORMATS: DocumentMimeType[] = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
  "text/plain",
  "text/html",
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 60 * 1024 * 1024; // 60MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const MAX_AUDIO_DURATION = 45 * 60; // 45 minutes in seconds

// Type guards for mime types
const isImageMimeType = (mime: string): mime is ImageMimeType =>
  ALLOWED_IMAGE_FORMATS.includes(mime as ImageMimeType);

const isVideoMimeType = (mime: string): mime is VideoMimeType =>
  ALLOWED_VIDEO_FORMATS.includes(mime as VideoMimeType);

const isAudioMimeType = (mime: string): mime is AudioMimeType =>
  ALLOWED_AUDIO_FORMATS.includes(mime as AudioMimeType);

const isDocumentMimeType = (mime: string): mime is DocumentMimeType =>
  ALLOWED_DOCUMENT_FORMATS.includes(mime as DocumentMimeType);

// Validation functions
const validateImageFormat = (file: UploadFile): boolean =>
  isImageMimeType(file.mimetype);

const validateImageSize = (file: UploadFile): boolean =>
  file.size <= MAX_IMAGE_SIZE;

const validateVideoFormat = (file: UploadFile): boolean =>
  isVideoMimeType(file.mimetype);

const validateVideoSize = (file: UploadFile): boolean =>
  file.size <= MAX_VIDEO_SIZE;

const validateAudioFormat = (file: UploadFile): boolean =>
  isAudioMimeType(file.mimetype);

const validateAudioSize = (file: UploadFile): boolean =>
  file.size <= MAX_AUDIO_SIZE;

const validateAudioLength = async (file: UploadFile): Promise<boolean> => {
  if (!file.tempFilePath) return true;

  // Implementation would use an actual audio duration library
  const bytesPerSecond = (128 * 1000) / 8; // 128kbps approximation
  const estimatedDuration = file.size / bytesPerSecond;
  return estimatedDuration <= MAX_AUDIO_DURATION;
};

const validateDocumentFormat = (file: UploadFile): boolean =>
  isDocumentMimeType(file.mimetype);

const validateDocumentSize = (file: UploadFile): boolean =>
  file.size <= MAX_DOCUMENT_SIZE;

export const removeTmp = async (path: string): Promise<void> => {
  try {
    await fs.unlink(path);
  } catch (err) {
    console.error("Error removing temp file:", err);
  }
};

export const validateMediaFiles = async (
  files: UploadFile[]
): Promise<ValidationResult> => {
  if (!files || files.length === 0) {
    return { valid: false, message: "No files were chosen" };
  }

  const imageCount = files.filter((file) =>
    file.mimetype.startsWith("image/")
  ).length;
  if (imageCount > MAX_IMAGES) {
    return {
      valid: false,
      message: `Too many images. Maximum ${MAX_IMAGES} allowed.`,
    };
  }

  for (const file of files) {
    if (file.mimetype.startsWith("video/")) {
      if (!validateVideoFormat(file)) {
        return { valid: false, message: "Unsupported video format." };
      }
      if (!validateVideoSize(file)) {
        return { valid: false, message: "Video size exceeds 100MB limit." };
      }
    } else if (file.mimetype.startsWith("image/")) {
      if (!validateImageFormat(file)) {
        return { valid: false, message: "Unsupported image format." };
      }
      if (!validateImageSize(file)) {
        return { valid: false, message: "Image size exceeds 10MB limit." };
      }
    } else if (file.mimetype.startsWith("audio/")) {
      if (!validateAudioFormat(file)) {
        return { valid: false, message: "Unsupported audio format." };
      }
      if (!validateAudioSize(file)) {
        return { valid: false, message: "Audio size exceeds 60MB limit." };
      }
      if (!(await validateAudioLength(file))) {
        return { valid: false, message: "Audio exceeds 45 minute limit." };
      }
    } else if (
      file.mimetype.startsWith("application/") ||
      file.mimetype.startsWith("text/")
    ) {
      if (!validateDocumentFormat(file)) {
        return { valid: false, message: "Unsupported document format." };
      }
      if (!validateDocumentSize(file)) {
        return { valid: false, message: "Document size exceeds 5MB limit." };
      }
    } else {
      return { valid: false, message: "Unsupported file type." };
    }
  }

  return { valid: true };
};
