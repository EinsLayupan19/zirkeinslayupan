import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type Handled = { status: number; body: unknown };

// Serves the serverless routes during `npm run dev`, using the same handlers as the Vercel functions in api/.
// Keys are read from .env.local (git-ignored). Without the VITE_ prefix, Vite never exposes them to the browser.
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      const routes: Record<string, (body: unknown, ip: string) => Promise<Handled>> = {
        "/api/adra": async (body, ip) => {
          const { handleAdra } = (await server.ssrLoadModule("/api/_adra.ts")) as typeof import("./api/_adra");
          return handleAdra({ body, ip, env: { GEMINI_API_KEY: env.GEMINI_API_KEY, GEMINI_MODEL: env.GEMINI_MODEL } });
        },
        "/api/contact": async (body, ip) => {
          const { handleContact } = (await server.ssrLoadModule("/api/_contact.ts")) as typeof import("./api/_contact");
          return handleContact({ body, ip, env: { RESEND_API_KEY: env.RESEND_API_KEY, CONTACT_TO: env.CONTACT_TO } });
        },
      };
      for (const [path, handle] of Object.entries(routes)) {
        server.middlewares.use(path, async (req, res) => {
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
            /* the handler answers 400 */
          }
          const r = await handle(body, req.socket.remoteAddress ?? "local");
          res.statusCode = r.status;
          res.end(JSON.stringify(r.body));
        });
      }
    },
  };
}

export default defineConfig({ plugins: [react(), devApi()] });
