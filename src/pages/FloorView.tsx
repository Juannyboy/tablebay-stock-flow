import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: string;
  room_number: string;
  assignmentCount: number;
  inRoomCount: number;
}

const FloorView = () => {
  const { floorId } = useParams();
  const navigate = useNavigate();
  const [floor, setFloor] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (floorId) {
      fetchFloorData();
    }
  }, [floorId]);

  const fetchFloorData = async () => {
    // Fetch floor details
    const { data: floorData } = await supabase
      .from("floors")
      .select("*")
      .eq("id", floorId)
      .single();

    if (floorData) setFloor(floorData);

    // Fetch rooms with assignment counts
    const { data: roomsData } = await supabase
      .from("rooms")
      .select(`
        id,
        room_number,
        item_assignments (
          id,
          status
        )
      `)
      .eq("floor_id", floorId)
      .order("room_number");

    if (roomsData) {
      const roomsWithCounts = roomsData.map((room: any) => ({
        id: room.id,
        room_number: room.room_number,
        assignmentCount: room.item_assignments?.length || 0,
        inRoomCount: room.item_assignments?.filter((a: any) => a.status === "in_room").length || 0,
      }));
      setRooms(roomsWithCounts);
    }
  };

  if (!floor) return null;

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

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{floor.display_name}</h1>
          <p className="text-muted-foreground">
            {rooms.length} rooms on this floor
          </p>
        </div>

        {rooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No rooms with assigned items yet on this floor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <DoorOpen className="h-5 w-5" />
                      Room {room.room_number}
                    </CardTitle>
                    {room.inRoomCount === room.assignmentCount && room.assignmentCount > 0 && (
                      <Badge variant="default" className="bg-success">
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items assigned:</span>
                      <span className="font-semibold">{room.assignmentCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In room:</span>
                      <span className="font-semibold">{room.inRoomCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorView;