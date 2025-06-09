import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from '../axiosInstance';
import { ApiResponse } from '../api-response';
import { AzureStorageService } from '../../service/azureBob';

// Update schema to match actual API response
const sasTokenResponseSchema = z.object({
  sasToken: z.string(),
});

type SasTokenResponse = z.infer<typeof sasTokenResponseSchema>;

interface UploadImageParams {
  file: File;
  restaurantId: string;
}

const storageService = new AzureStorageService();

export const useStorage = () => {
  const uploadImage = useMutation({
    mutationFn: async ({ file, restaurantId }: UploadImageParams): Promise<string> => {
      try {
        // Get SAS token using axios instance
        const response = await axiosInstance.post<ApiResponse<SasTokenResponse>>(`/storage/sas-token/${restaurantId}`);

        if (!response.data) {
          throw new Error('No response data received');
        }

        // Log response for debugging
        console.log('Raw API Response:', response.data);

        // Check if data exists and extract sasToken
        if (!response.data.data) {
          throw new Error('No data received in response');
        }

        const { sasToken } = response.data.data;

        // Validate sasToken
        if (!sasToken || typeof sasToken !== 'string') {
          throw new Error('Invalid SAS token received');
        }

        // Upload image using the validated SAS token
        const imageUrl = await storageService.uploadImage(sasToken, file);

        console.log('Upload successful, image URL:', imageUrl);
        return imageUrl;
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Validation error:', {
            errors: error.errors,
            received: error.format(),
          });
          throw new Error('Invalid API response format');
        }

        console.error('Upload failed:', error);
        throw error;
      }
    },
  });

  return {
    uploadImage,
  };
};
