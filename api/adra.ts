// POST /api/adra on Vercel. The key comes from the GEMINI_API_KEY environment variable
// (Vercel: Project Settings > Environment Variables). It is never sent to the browser.
import { handleAdra } from "./_adra";

export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* handleAdra answers 400 */
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const r = await handleAdra({
    body,
    ip,
    env: { GEMINI_API_KEY: process.env.GEMINI_API_KEY, GEMINI_MODEL: process.env.GEMINI_MODEL },
  });
  return Response.json(r.body, { status: r.status, headers: { "Cache-Control": "no-store" } });
}
