import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

interface NeededItem {
  id: string;
  item_type: string;
  quantity: number;
  description?: string;
  fulfilled: boolean;
}

interface Floor {
  id: string;
  floor_number: string;
  display_name: string;
}

interface Room {
  id: string;
  room_number: string;
  floor_id: string;
  floor_display: string;
  needed_items: NeededItem[];
  is_complete: boolean;
}

const RoomChecklist = () => {
  const navigate = useNavigate();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFloorsAndRooms();
  }, []);

  const fetchFloorsAndRooms = async () => {
    try {
      const { data: floorsData } = await supabase
        .from("floors")
        .select("*")
        .order("floor_number");

      if (floorsData) {
        setFloors(floorsData);
        if (floorsData.length > 0) {
          setSelectedFloorId(floorsData[0].id);
        }
      }

      const { data: roomsData } = await supabase
        .from("rooms")
        .select(`
          id,
          room_number,
          floor_id,
          floors (
            display_name
          )
        `)
        .order("room_number");

      const { data: neededItems } = await supabase
        .from("needed_items")
        .select("*");

      if (!roomsData) return;

      const roomsWithNeeds: Room[] = roomsData.map((room) => {
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
          floor_id: room.floor_id,
          floor_display: room.floors?.display_name || "",
          needed_items: items,
          is_complete: items.length > 0 && items.every((i) => i.fulfilled),
        };
      });

      setRooms(roomsWithNeeds);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => room.floor_id === selectedFloorId);

  if (loading) {
    return <div className="min-h-screen bg-background p-4 md:p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 md:mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Room Checklist</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Select floor and tap a room to manage its checklist
          </p>
        </div>

        {/* Floor Selector */}
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <CardTitle>Select Floor</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a floor" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredRooms.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                No rooms on this floor
              </CardContent>
            </Card>
          ) : (
            filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer transition-all hover:ring-2 hover:ring-primary"
                onClick={() => navigate(`/checklist/${room.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg truncate">
                        Room {room.room_number}
                      </CardTitle>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {room.floor_display}
                      </p>
                    </div>
                    {room.is_complete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 ml-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 ml-2" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs md:text-sm">
                    {room.needed_items.length === 0 ? (
                      <span className="text-muted-foreground">No items defined</span>
                    ) : (
                      <>
                        <span className="font-medium">
                          {room.needed_items.filter((i) => i.fulfilled).length}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}/ {room.needed_items.length} items
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomChecklist;
