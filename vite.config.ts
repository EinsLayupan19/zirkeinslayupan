import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Serves POST /api/adra during `npm run dev`, using the same handler as the Vercel function in api/adra.ts.
// The key is read from .env.local (git-ignored). Without the VITE_ prefix, Vite never exposes it to the browser.
function adraDevApi(): Plugin {
  return {
    name: "adra-dev-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      server.middlewares.use("/api/adra", async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Use POST." }));
          return;
        }
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 64_000) break;
        }
        let body: unknown = null;
        try {
          body = JSON.parse(raw);
        } catch {
          /* handleAdra answers 400 */
        }
        const { handleAdra } = (await server.ssrLoadModule("/api/_adra.ts")) as typeof import("./api/_adra");
        const r = await handleAdra({
          body,
          ip: req.socket.remoteAddress ?? "local",
          env: { GEMINI_API_KEY: env.GEMINI_API_KEY, GEMINI_MODEL: env.GEMINI_MODEL },
        });
        res.statusCode = r.status;
        res.end(JSON.stringify(r.body));
      });
    },
  };
}

export default defineConfig({ plugins: [react(), adraDevApi()] });
