import axios from "axios";

export async function GET() {
  try {
    const res = await axios.get(
      "https://ticket.stalwartng.com/api/get-analytics/"
    );
    return new Response(JSON.stringify(res.data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy fetch failed:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch" }), {
      status: 500,
    });
  }
}
