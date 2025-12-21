import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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

      // Crear referencia única para la foto
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `flight-certificates/${flightId}/${fileName}`);

      // Subir el archivo
      const snapshot = await uploadBytes(storageRef, file);

      setUploadProgress(100);

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
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
      // Extraer el path de la URL
      const url = new URL(certificateUrl);
      const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
      const storageRef = ref(storage, path);

      await deleteObject(storageRef);
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