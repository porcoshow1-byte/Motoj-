import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isMockMode } from './firebase';

/**
 * Uploads a file to Firebase Storage or returns a base64 string in mock mode.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'avatars/user_123')
 * @returns Promise<string> The download URL
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
    // Fallback for Mock Mode or if Storage is not configured
    if (isMockMode || !storage) {
        console.warn("Storage upload mocked (Base64)");
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    try {
        const storageRef = ref(storage, path);
        // Add some metadata if needed
        const metadata = {
            contentType: file.type,
        };

        const snapshot = await uploadBytes(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file to Firebase Storage:", error);
        throw error;
    }
};
