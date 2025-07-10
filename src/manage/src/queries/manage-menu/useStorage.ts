import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from '../axiosInstance';
export const azureConfig = {
  maxFileSize: 5 * 1024 * 1024,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
};
interface UploadImageParams {
  file: File;
  restaurantId: string;
  folder: string;
}

const ResponseImageData = z.object({
  imageUrl: z.string().url(),
});

export type ResponseImageData = z.infer<typeof ResponseImageData>;

export const useStorage = () => {
  const uploadImage = useMutation({
    mutationFn: async ({ file, restaurantId, folder }: UploadImageParams): Promise<string> => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await axiosInstance.post<ResponseImageData>(`/storage/upload/${restaurantId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.debug('Image uploaded successfully:', response.data.imageUrl);

        return response.data.imageUrl;
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },
  });

  return { uploadImage };
};
