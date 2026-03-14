// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxthub/core"],

  hub: {
    db: "sqlite",
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
  },

  css: ["./assets/css/main.css"],

  runtimeConfig: {
    googleGenaiApiKey: process.env.GOOGLE_GENAI_API_KEY || "",
    payosClientId: process.env.PAYOS_CLIENT_ID || "",
    payosApiKey: process.env.PAYOS_API_KEY || "",
    payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
    adminPassword: process.env.ADMIN_PASSWORD || "",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    public: {
      appUrl: process.env.APP_URL || "http://localhost:3000",
    },
  },
});
