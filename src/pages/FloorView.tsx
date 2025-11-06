import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DoorOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateRoomsDialog } from "@/components/CreateRoomsDialog";
import { EditRoomDialog } from "@/components/EditRoomDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [createRoomsOpen, setCreateRoomsOpen] = useState(false);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<{ id: string; room_number: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; room_number: string } | null>(null);

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

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomToDelete.id);

      if (error) throw error;

      toast.success("Room deleted successfully");
      fetchFloorData();
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
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

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{floor.display_name}</h1>
            <p className="text-muted-foreground">
              {rooms.length} rooms on this floor
            </p>
          </div>
          <Button onClick={() => setCreateRoomsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Rooms
          </Button>
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
              <Card key={room.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      <DoorOpen className="h-5 w-5" />
                      Room {room.room_number}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {room.inRoomCount === room.assignmentCount && room.assignmentCount > 0 && (
                        <Badge variant="default" className="bg-success">
                          Complete
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomToEdit({ id: room.id, room_number: room.room_number });
                          setEditRoomOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomToDelete({ id: room.id, room_number: room.room_number });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => navigate(`/room/${room.id}`)} className="cursor-pointer">
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

        <CreateRoomsDialog
          floorId={floorId!}
          open={createRoomsOpen}
          onOpenChange={setCreateRoomsOpen}
          onRoomsCreated={fetchFloorData}
        />

        <EditRoomDialog
          room={roomToEdit}
          open={editRoomOpen}
          onOpenChange={setEditRoomOpen}
          onRoomUpdated={fetchFloorData}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Room</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete room {roomToDelete?.room_number}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRoom}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FloorView;