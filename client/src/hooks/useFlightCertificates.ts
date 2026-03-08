import { useState } from 'react';

const CLOUDINARY_CLOUD_NAME = "drjrozqs8";
const CLOUDINARY_UPLOAD_PRESET = "luggage_photos";

export function useFlightCertificates() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadCertificate = async (
    file: File,
    flightId: string
  ): Promise<string> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'flight-certificates');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);

      return data.secure_url;
    } catch (error) {
      console.error('Error uploading certificate:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteCertificate = async (certificateUrl: string): Promise<void> => {
    try {
      // Cloudinary deletion would require API key/secret (backend only)
      // For now, just log - images stay in Cloudinary but are not referenced
      console.log('Certificate URL no longer referenced:', certificateUrl);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  };

  return {
    uploadCertificate,
    deleteCertificate,
    uploading,
    uploadProgress,
  };
}