import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface NeededItem {
  id: string;
  item_type: string;
  quantity: number;
  description?: string;
  fulfilled: boolean;
}

interface Room {
  id: string;
  room_number: string;
  floor_display: string;
  needed_items: NeededItem[];
  is_complete: boolean;
}

const RoomChecklist = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select(`
          id,
          room_number,
          floors (
            display_name
          )
        `)
        .order("room_number");

      const { data: neededItems } = await supabase
        .from("needed_items")
        .select("*");

      if (!roomsData) return;

      const roomsWithNeeds: Room[] = roomsData
        .map((room) => {
          const items = (neededItems || [])
            .filter((item) => item.room_id === room.id)
            .map((item) => ({
              id: item.id,
              item_type: item.item_type,
              quantity: item.quantity,
              description: item.description,
              fulfilled: item.fulfilled,
            }));

          return {
            id: room.id,
            room_number: room.room_number,
            floor_display: room.floors?.display_name || "",
            needed_items: items,
            is_complete: items.length > 0 && items.every((i) => i.fulfilled),
          };
        })
        .filter((r) => r.needed_items.length > 0);

      setRooms(roomsWithNeeds);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckItem = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("needed_items")
        .update({ fulfilled: !currentStatus })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(
        !currentStatus ? "Item marked as received" : "Item marked as pending"
      );
      fetchRooms();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Room Checklist</h1>
          <p className="text-muted-foreground">
            Check off items as they arrive in each room
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room List */}
          <div className="lg:col-span-1 space-y-3">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer transition-all ${
                  selectedRoom?.id === room.id
                    ? "ring-2 ring-primary"
                    : "hover:ring-1 hover:ring-border"
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Room {room.room_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {room.floor_display}
                      </p>
                    </div>
                    {room.is_complete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {room.needed_items.filter((i) => i.fulfilled).length} /{" "}
                    {room.needed_items.length} items
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checklist */}
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Room {selectedRoom.room_number} - {selectedRoom.floor_display}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Check items as they arrive
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedRoom.needed_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                      >
                        <Checkbox
                          checked={item.fulfilled}
                          onCheckedChange={() =>
                            handleCheckItem(item.id, item.fulfilled)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                item.fulfilled
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {item.item_type}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              × {item.quantity}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a room to view its checklist
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomChecklist;
