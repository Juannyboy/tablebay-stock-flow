import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all relevant data
    const { data: items } = await supabase.from("items").select("*");
    const { data: rooms } = await supabase.from("rooms").select(`
      *,
      floors(floor_number, display_name)
    `);
    const { data: assignments } = await supabase.from("item_assignments").select(`
      *,
      items(item_type, description),
      rooms(room_number, floors(floor_number, display_name))
    `);

    const context = `
You are a helpful stock assistant for a construction site at Table Bay hotel.

IMPORTANT INSTRUCTIONS:
- Answer ANY question about rooms, floors, items, assignments, or needed items
- You can aggregate data by floor, item type, room, or any other dimension
- When asked about rooms that DON'T have something, check all rooms on that floor and find which ones are missing that item type
- Floor names like "5 east" refer to floors where display_name contains "east" and floor_number is "5"
- Item types are case-insensitive (e.g., "doorframes", "Doorframes", "DOORFRAMES" are the same)
- You can summarize, count, list, or analyze the data in any way that helps answer the user's question
- Be specific with room numbers and floor information

ALL ROOMS IN THE DATABASE:
${JSON.stringify(rooms, null, 2)}

CURRENT STOCK ITEMS:
${JSON.stringify(items, null, 2)}

ITEM ASSIGNMENTS TO ROOMS:
${JSON.stringify(assignments, null, 2)}

Answer the user's question clearly and accurately based on this data.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: context },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
