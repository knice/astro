import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing required 'url' query parameter.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return new Response("Invalid URL provided.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return new Response("Only http and https URLs are supported.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let response: Response;
  try {
    response = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CloudflareWorker/1.0)" },
    });
  } catch {
    return new Response("Failed to fetch the provided URL.", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!response.ok) {
    return new Response(`Upstream server returned ${response.status} ${response.statusText}.`, {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const html = await response.text();

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    return new Response("No <body> tag found in the fetched page.", {
      status: 422,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(bodyMatch[1], {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
