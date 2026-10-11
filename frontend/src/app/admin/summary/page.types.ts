// Database types moved to Laravel backend
// These will be replaced with API response types

// The shape of the data expected by the table
// Includes user details and their uploads
export type UserWithUploads = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  uploads: MediaUpload[];
};

export type MediaUpload = {
  id: string;
  url: string;
  type: string;
  key: string;
  createdAt: Date;
};
