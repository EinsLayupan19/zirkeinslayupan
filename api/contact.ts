// POST /api/contact on Vercel. The key comes from the RESEND_API_KEY environment variable
// (Vercel: Project Settings > Environment Variables). It is never sent to the browser.
import { handleContact } from "./_contact";

export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* handleContact answers 400 */
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const r = await handleContact({
    body,
    ip,
    env: { RESEND_API_KEY: process.env.RESEND_API_KEY, CONTACT_TO: process.env.CONTACT_TO },
  });
  return Response.json(r.body, { status: r.status, headers: { "Cache-Control": "no-store" } });
}
