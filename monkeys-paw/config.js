// The one value the page needs: where the Cloudflare Worker lives.
// This URL is public by design — the API key lives only in the Worker's secrets.
window.PAW_CONFIG = {
  workerUrl: "https://monkeys-paw.YOUR-SUBDOMAIN.workers.dev"
};
