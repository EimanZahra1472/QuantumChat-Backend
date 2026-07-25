import { GoogleDriveStorageAdapter } from './GoogleDriveStorageAdapter.js';

/** @type {import('./GoogleDriveStorageAdapter.js').GoogleDriveStorageAdapter | null} */
let cached;

/**
 * Durable blob storage — Google Drive only (no local uploads/ disk).
 * Requires GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY.
 */
export function getStorage() {
  if (cached) return cached;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!folderId || !email || !key) {
    throw new Error(
      'Google Drive storage requires GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY'
    );
  }
  cached = new GoogleDriveStorageAdapter(folderId, email, key);
  return cached;
}

export function getStorageProviderName() {
  return 'google-drive';
}

export { GoogleDriveStorageAdapter } from './GoogleDriveStorageAdapter.js';
