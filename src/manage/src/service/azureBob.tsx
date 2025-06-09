import { BlobServiceClient } from '@azure/storage-blob';
export const azureConfig = {
  maxFileSize: 5 * 1024 * 1024,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedOrigins: ['http://localhost:5174'],

  containerPrefix: 'restaurant-',
};
export class AzureStorageService {
  private async getBlobClient(sasUrl: string) {
    return new BlobServiceClient(sasUrl);
  }

  async uploadImage(sasUrl: string, file: File): Promise<string> {
    try {
      const blobServiceClient = await this.getBlobClient(sasUrl);
      const containerClient = blobServiceClient.getContainerClient('');
      const blobName = `${file.name.toLowerCase().replace(/[^a-z0-9-.]/g, '-')}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(await file.arrayBuffer(), {
        blobHTTPHeaders: {
          blobContentType: file.type,
          blobCacheControl: 'public, max-age=31536000',
        },
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}
