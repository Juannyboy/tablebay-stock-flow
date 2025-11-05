import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, CheckCircle2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransferItemDialog } from "@/components/TransferItemDialog";
import { NeededItemDialog } from "@/components/NeededItemDialog";
import { toast } from "sonner";

interface ItemAssignment {
  id: string;
  status: string;
  items: {
    id: string;
    item_type: string;
    description: string;
  };
}

interface NeededItem {
  id: string;
  item_type: string;
  description: string;
  quantity: number;
  notes: string;
  fulfilled: boolean;
}

const RoomView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [assignments, setAssignments] = useState<ItemAssignment[]>([]);
  const [neededItems, setNeededItems] = useState<NeededItem[]>([]);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [neededItemDialogOpen, setNeededItemDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ItemAssignment | null>(null);

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  const fetchRoomData = async () => {
    const { data: roomData } = await supabase
      .from("rooms")
      .select(`
        *,
        floors (
          display_name
        )
      `)
      .eq("id", roomId)
      .single();

    if (roomData) setRoom(roomData);

    const { data: assignmentsData } = await supabase
      .from("item_assignments")
      .select(`
        id,
        status,
        items (
          id,
          item_type,
          description
        )
      `)
      .eq("room_id", roomId);

    if (assignmentsData) setAssignments(assignmentsData as any);

    const { data: neededData } = await supabase
      .from("needed_items")
      .select("*")
      .eq("room_id", roomId)
      .eq("fulfilled", false);

    if (neededData) setNeededItems(neededData);
  };

  const updateStatus = async (assignmentId: string, newStatus: "building" | "built" | "delivering" | "in_room") => {
    const { error } = await supabase
      .from("item_assignments")
      .update({ status: newStatus })
      .eq("id", assignmentId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated");
      fetchRoomData();
    }
  };

  const handleTransfer = (assignment: ItemAssignment) => {
    setSelectedAssignment(assignment);
    setTransferDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "building": return "warning";
      case "built": return "info";
      case "delivering": return "secondary";
      case "in_room": return "success";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Room {room.room_number}</h1>
            <p className="text-muted-foreground">{room.floors?.display_name}</p>
          </div>
          <Button onClick={() => setNeededItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Items Not on Site
          </Button>
        </div>

        {neededItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Items Needed (Not on Site)</h2>
            <div className="space-y-3">
              {neededItems.map((item) => (
                <Card key={item.id} className="border-warning">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.item_type}</CardTitle>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">Quantity: {item.quantity}</Badge>
                    </div>
                  </CardHeader>
                  {item.notes && (
                    <CardContent>
                      <p className="text-sm">{item.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">Assigned Items</h2>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No items assigned to this room yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {assignment.items.item_type}
                      </CardTitle>
                      {assignment.items.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {assignment.items.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusColor(assignment.status) as any}>
                      {getStatusLabel(assignment.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {assignment.status !== "in_room" && (
                      <>
                        {assignment.status === "building" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(assignment.id, "built")}
                          >
                            Mark as Built
                          </Button>
                        )}
                        {assignment.status === "built" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(assignment.id, "delivering")}
                          >
                            Start Delivery
                          </Button>
                        )}
                        {assignment.status === "delivering" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(assignment.id, "in_room")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark in Room
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTransfer(assignment)}
                    >
                      Transfer to Another Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {selectedAssignment && (
          <TransferItemDialog
            assignment={selectedAssignment}
            currentRoomId={roomId!}
            open={transferDialogOpen}
            onOpenChange={setTransferDialogOpen}
            onTransferComplete={() => {
              fetchRoomData();
              setTransferDialogOpen(false);
            }}
          />
        )}

        <NeededItemDialog
          open={neededItemDialogOpen}
          onOpenChange={setNeededItemDialogOpen}
          onComplete={() => {
            fetchRoomData();
            setNeededItemDialogOpen(false);
          }}
          roomId={roomId}
        />
      </div>
    </div>
  );
};

export default RoomView;