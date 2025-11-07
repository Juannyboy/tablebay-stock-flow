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
    const { data: neededItems } = await supabase.from("needed_items").select(`
      *,
      rooms(room_number, floors(floor_number, display_name))
    `);

    const context = `
You are a precise stock assistant for the Table Bay hotel construction site.

DATA ANALYSIS RULES:
1. ROOMS WITHOUT ITEMS: To find rooms that DON'T have an item:
   - List ALL rooms on the specified floor
   - Check which rooms have that item in assignments
   - Return ONLY rooms that are NOT in the assignments list
   
2. FLOOR IDENTIFICATION:
   - "5 east" = floor_number="5" AND display_name contains "east" (case-insensitive)
   - Match partial names: "east" matches "5 East", "East Wing", etc.
   
3. ITEM MATCHING:
   - Item types are case-insensitive
   - Match partial names: "door" matches "doorframes", "Door Frames", etc.
   
4. ROOM COMPLETION:
   - Room is complete when ALL needed items have fulfilled=true (checked off in the checklist)
   - Room is incomplete if ANY needed items have fulfilled=false (not yet checked off)
   - The system uses a checklist where staff tick items as they physically arrive in rooms
   
5. SHORTAGE ANALYSIS:
   - Compare needed_items against current assignments
   - List specific rooms and quantities for each shortage

DATABASE TABLES:

ROOMS (All rooms in system):
${JSON.stringify(rooms, null, 2)}

STOCK ITEMS (Available inventory):
${JSON.stringify(items, null, 2)}

ITEM ASSIGNMENTS (Items assigned to rooms with status):
${JSON.stringify(assignments, null, 2)}

NEEDED ITEMS (Requested items not yet fulfilled):
${JSON.stringify(neededItems, null, 2)}

RESPONSE FORMAT:
- Be concise and specific
- Always include room numbers and floor names
- List items with their exact status
- When showing shortages, group by room and item type
- Use bullet points for lists

Answer accurately based on the data above.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: context },
          { role: "user", content: question },
        ],
        temperature: 0.1,
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
