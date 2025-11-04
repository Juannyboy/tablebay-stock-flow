import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AssignItemDialogProps {
  item: {
    id: string;
    item_type: string;
    quantity_total: number;
    quantity_assigned: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignComplete: () => void;
}

export const AssignItemDialog = ({
  item,
  open,
  onOpenChange,
  onAssignComplete,
}: AssignItemDialogProps) => {
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFloors();
  }, []);

  const fetchFloors = async () => {
    const { data } = await supabase
      .from("floors")
      .select("*")
      .order("floor_number");
    
    if (data) setFloors(data);
  };

  const handleAssign = async () => {
    if (!selectedFloorId || !roomNumber) {
      toast.error("Please select a floor and enter a room number");
      return;
    }

    setLoading(true);

    try {
      // Check if room exists, create if not
      let { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("floor_id", selectedFloorId)
        .eq("room_number", roomNumber)
        .single();

      if (roomError && roomError.code === "PGRST116") {
        // Room doesn't exist, create it
        const { data: newRoom, error: createError } = await supabase
          .from("rooms")
          .insert({
            floor_id: selectedFloorId,
            room_number: roomNumber,
          })
          .select()
          .single();

        if (createError) throw createError;
        room = newRoom;
      } else if (roomError) {
        throw roomError;
      }

      // Assign item to room
      const { error: assignError } = await supabase
        .from("item_assignments")
        .insert({
          item_id: item.id,
          room_id: room.id,
          status: "building",
        });

      if (assignError) throw assignError;

      // Update quantity assigned
      const { error: updateError } = await supabase
        .from("items")
        .update({ quantity_assigned: item.quantity_assigned + 1 })
        .eq("id", item.id);

      if (updateError) throw updateError;

      toast.success(`Assigned to room ${roomNumber}`);
      setRoomNumber("");
      onAssignComplete();
    } catch (error) {
      console.error("Error assigning item:", error);
      toast.error("Failed to assign item");
    } finally {
      setLoading(false);
    }
  };

  const remainingQuantity = item.quantity_total - item.quantity_assigned;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {item.item_type} to Room</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-secondary p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Remaining to assign:</p>
            <p className="text-2xl font-bold">{remainingQuantity}</p>
          </div>

          <div className="space-y-2">
            <Label>Floor</Label>
            <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input
              placeholder="e.g., 1001"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleAssign} 
            className="w-full" 
            disabled={loading || remainingQuantity === 0}
          >
            {loading ? "Assigning..." : "Assign to Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};