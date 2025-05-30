export default {
	async fetch(request, env, ctx) {
	  if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	  }
  
	  const rawBody = await request.text();
	  const headers = Object.fromEntries(request.headers.entries());
  
	  console.log("✅ Received webhook from Stripe, forwarding to Vercel");
  
	  ctx.waitUntil(
		fetch("https://www.taxtracker.ca/api/webhook", {
		  method: "POST",
		  headers,
		  body: rawBody,
		}).then((res) =>
		  res.text().then((text) => {
			console.log("📤 Forwarded to Vercel webhook:", res.status, text);
		  })
		).catch((err) => {
		  console.error("❌ Failed to forward to Vercel webhook:", err);
		})
	  );
  
	  return new Response("Received", { status: 200 });
	}
  };