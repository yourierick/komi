// Mock function for uploads queries
// TODO: Implement actual API calls to Laravel backend

export async function getUsersWithUploads() {
  // Temporary mock data - replace with actual API call
  return [];
}

export type UserWithUploads = {
  id: string;
  name: string;
  email: string;
  uploads: Array<{
    id: string;
    url: string;
    type: string;
    key: string;
    createdAt: Date;
  }>;
};
