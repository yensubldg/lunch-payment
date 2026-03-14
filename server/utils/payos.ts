import { PayOS } from "@payos/node";

let payosClient: InstanceType<typeof PayOS> | null = null;

export function getPayOS() {
  if (!payosClient) {
    const config = useRuntimeConfig();
    payosClient = new PayOS({
      clientId: config.payosClientId,
      apiKey: config.payosApiKey,
      checksumKey: config.payosChecksumKey,
    });
  }
  return payosClient;
}
