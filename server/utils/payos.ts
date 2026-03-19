import { PayOS } from "@payos/node";

let payosClient: InstanceType<typeof PayOS> | null = null;
let confirmedWebhookUrl: string | null = null;
let confirmingWebhookPromise: Promise<void> | null = null;
let loggedInvalidWebhookUrl = false;

function buildWebhookUrl(appUrl: string) {
  const normalizedAppUrl = appUrl.replace(/\/+$/, "");
  return `${normalizedAppUrl}/api/webhooks/payos`;
}

function isPublicHttpsUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== "https:") return false;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return false;
    }
    if (host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

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

export async function ensurePayOSWebhookConfigured() {
  const config = useRuntimeConfig();
  const webhookUrl = buildWebhookUrl(config.public.appUrl);

  if (confirmedWebhookUrl === webhookUrl) return;

  // PayOS only validates publicly reachable HTTPS webhook URLs.
  if (!isPublicHttpsUrl(webhookUrl)) {
    if (!loggedInvalidWebhookUrl) {
      loggedInvalidWebhookUrl = true;
      console.warn(
        `[PayOS] Skip webhook confirmation: APP_URL must be a public HTTPS URL. Current webhook URL: ${webhookUrl}`
      );
    }
    return;
  }

  if (confirmingWebhookPromise) {
    await confirmingWebhookPromise;
    return;
  }

  confirmingWebhookPromise = (async () => {
    try {
      const payos = getPayOS();
      await payos.webhooks.confirm(webhookUrl);
      confirmedWebhookUrl = webhookUrl;
      console.info(`[PayOS] Webhook configured: ${webhookUrl}`);
    } catch (error) {
      // Don't block payment creation if webhook confirmation is temporarily failing.
      console.error("[PayOS] Failed to confirm webhook URL:", error);
    } finally {
      confirmingWebhookPromise = null;
    }
  })();

  await confirmingWebhookPromise;
}
