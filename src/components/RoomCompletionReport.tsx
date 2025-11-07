import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface RoomStatus {
  room_id: string;
  room_number: string;
  floor_display: string;
  needed_items: Array<{
    item_type: string;
    quantity: number;
    description?: string;
    fulfilled: boolean;
  }>;
  assigned_items: Array<{
    item_type: string;
    status: string;
    quantity: number;
  }>;
  is_complete: boolean;
  missing_items: Array<{
    item_type: string;
    quantity: number;
  }>;
}

export const RoomCompletionReport = () => {
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomStatuses();
  }, []);

  const fetchRoomStatuses = async () => {
    try {
      // Fetch all rooms with their floor info
      const { data: rooms } = await supabase
        .from("rooms")
        .select(`
          id,
          room_number,
          floors (
            display_name
          )
        `)
        .order("room_number");

      // Fetch needed items per room
      const { data: neededItems } = await supabase
        .from("needed_items")
        .select("*");

      // Fetch assignments per room
      const { data: assignments } = await supabase
        .from("item_assignments")
        .select(`
          *,
          items (
            item_type,
            description
          )
        `);

      if (!rooms) {
        setLoading(false);
        return;
      }

      // Build room status for each room
      const statuses: RoomStatus[] = rooms.map((room) => {
        const roomNeededItems = (neededItems || [])
          .filter((item) => item.room_id === room.id)
          .map((item) => ({
            item_type: item.item_type,
            quantity: item.quantity,
            description: item.description,
            fulfilled: item.fulfilled,
          }));

        const roomAssignments = (assignments || [])
          .filter((assign) => assign.room_id === room.id)
          .reduce((acc, assign) => {
            const itemType = assign.items?.item_type || "";
            const existing = acc.find((a) => a.item_type === itemType);
            if (existing) {
              existing.quantity += 1;
            } else {
              acc.push({
                item_type: itemType,
                status: assign.status,
                quantity: 1,
              });
            }
            return acc;
          }, [] as Array<{ item_type: string; status: string; quantity: number }>);

        // Calculate missing items
        const missingItems: Array<{ item_type: string; quantity: number }> = [];
        roomNeededItems.forEach((needed) => {
          const assigned = roomAssignments.filter(
            (a) => a.item_type.toLowerCase() === needed.item_type.toLowerCase() && a.status === "in_room"
          );
          const assignedQty = assigned.reduce((sum, a) => sum + a.quantity, 0);
          if (assignedQty < needed.quantity) {
            missingItems.push({
              item_type: needed.item_type,
              quantity: needed.quantity - assignedQty,
            });
          }
        });

        const isComplete = roomNeededItems.length > 0 && missingItems.length === 0;

        return {
          room_id: room.id,
          room_number: room.room_number,
          floor_display: room.floors?.display_name || "",
          needed_items: roomNeededItems,
          assigned_items: roomAssignments,
          is_complete: isComplete,
          missing_items: missingItems,
        };
      });

      // Filter to only show rooms with needed items
      const roomsWithNeeds = statuses.filter((s) => s.needed_items.length > 0);
      setRoomStatuses(roomsWithNeeds);
    } catch (error) {
      console.error("Error fetching room statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading room statuses...</div>;
  }

  const completeRooms = roomStatuses.filter((r) => r.is_complete);
  const incompleteRooms = roomStatuses.filter((r) => !r.is_complete);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomStatuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Complete Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completeRooms.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Incomplete Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{incompleteRooms.length}</div>
          </CardContent>
        </Card>
      </div>

      {incompleteRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Rooms with Shortages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {incompleteRooms.map((room) => (
                <div key={room.room_id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Room {room.room_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">{room.floor_display}</p>
                    </div>
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                  </div>
                  
                  {room.missing_items.length > 0 && (
                    <div className="mt-3 bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                      <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                        Missing Items:
                      </h4>
                      <ul className="space-y-1">
                        {room.missing_items.map((item, idx) => (
                          <li key={idx} className="text-sm text-orange-700 dark:text-orange-400">
                            • {item.item_type}: <strong>{item.quantity}</strong> needed
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {completeRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {completeRooms.map((room) => (
                <div
                  key={room.room_id}
                  className="flex items-center gap-2 p-2 border rounded-lg bg-green-50 dark:bg-green-950/20"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Room {room.room_number}</div>
                    <div className="text-xs text-muted-foreground">{room.floor_display}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
