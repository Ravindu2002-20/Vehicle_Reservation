// Deprecated placeholder to avoid route collisions.
export async function GET() {
  return new Response(JSON.stringify({ error: "Not implemented" }), {
    status: 501,
    headers: { "content-type": "application/json" },
  });
}

