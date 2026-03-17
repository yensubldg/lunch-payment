import { PayOS } from "@payos/node";

let payosClient: InstanceType<typeof PayOS> | null = null;

export function getPayOS() {
  if (!payosClient) {
    const config = useRuntimeConfig();
    const safeFetch = globalThis.fetch.bind(globalThis);

    payosClient = new PayOS({
      clientId: config.payosClientId,
      apiKey: config.payosApiKey,
      checksumKey: config.payosChecksumKey,
      fetch: safeFetch,
    });
  }
  return payosClient;
}
