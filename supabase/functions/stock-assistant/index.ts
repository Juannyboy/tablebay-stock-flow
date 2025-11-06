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
You are a stock assistant for a construction site at Table Bay hotel.

IMPORTANT INSTRUCTIONS:
- When asked about rooms that DON'T have something, you MUST check the complete list of all rooms and find which ones are missing that item type.
- Floor names like "5 east" refer to floors where display_name contains "east" and floor_number is "5".
- Item types are case-insensitive (e.g., "doorframes", "Doorframes", "DOORFRAMES" are the same).
- To find rooms WITHOUT an item: Look at ALL rooms on that floor, then exclude rooms that have assignments for that item_type.

ALL ROOMS IN THE DATABASE:
${JSON.stringify(rooms, null, 2)}

CURRENT STOCK ITEMS:
${JSON.stringify(items, null, 2)}

ITEM ASSIGNMENTS TO ROOMS:
${JSON.stringify(assignments, null, 2)}

When answering:
1. First identify all rooms matching the floor criteria
2. Then check which of those rooms have the specified item assigned
3. Return the rooms that DON'T have that item (the ones missing from assignments)
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
