import { BlobServiceClient, ContainerClient, ContainerSASPermissions, SASProtocol } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else {
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      const url = `https://${accountName}.blob.core.windows.net`;
      const credential = new DefaultAzureCredential();
      this.blobServiceClient = new BlobServiceClient(url, credential);
    }
  }
  async generateSasToken(restaurantId: string): Promise<string> {
    try {
      const containerClient = await this.getOrCreateContainer(restaurantId);

      const permissions = ContainerSASPermissions.parse('racwdl'); // Read, Add, Create, Write, Delete, List

      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 30);

      const startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - 5);

      const sasOptions = {
        containerName: containerClient.containerName,
        permissions: permissions,
        startsOn: startTime,
        expiresOn: expiryTime,
        protocol: SASProtocol.Https,
      };

      const sasToken = await containerClient.generateSasUrl(sasOptions);

      return sasToken;
    } catch (error) {
      console.error('Error generating SAS token:', error);
      throw error;
    }
  }

  private async getOrCreateContainer(restaurantId: string): Promise<ContainerClient> {
    const containerName = restaurantId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const containerClient = this.blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists({
      access: 'blob',
    });

    return containerClient;
  }
}
