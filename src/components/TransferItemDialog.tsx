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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TransferItemDialogProps {
  assignment: {
    id: string;
    items: {
      item_type: string;
    };
  };
  currentRoomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete: () => void;
}

export const TransferItemDialog = ({
  assignment,
  currentRoomId,
  open,
  onOpenChange,
  onTransferComplete,
}: TransferItemDialogProps) => {
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [reason, setReason] = useState("");
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

  const handleTransfer = async () => {
    if (!selectedFloorId || !roomNumber) {
      toast.error("Please select a floor and enter a room number");
      return;
    }

    setLoading(true);

    try {
      // Check if target room exists, create if not
      let { data: targetRoom, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("floor_id", selectedFloorId)
        .eq("room_number", roomNumber)
        .single();

      if (roomError && roomError.code === "PGRST116") {
        const { data: newRoom, error: createError } = await supabase
          .from("rooms")
          .insert({
            floor_id: selectedFloorId,
            room_number: roomNumber,
          })
          .select()
          .single();

        if (createError) throw createError;
        targetRoom = newRoom;
      } else if (roomError) {
        throw roomError;
      }

      // Record the transfer
      const { error: transferError } = await supabase
        .from("item_transfers")
        .insert({
          assignment_id: assignment.id,
          from_room_id: currentRoomId,
          to_room_id: targetRoom.id,
          reason: reason || null,
        });

      if (transferError) throw transferError;

      // Update the assignment to new room
      const { error: updateError } = await supabase
        .from("item_assignments")
        .update({ room_id: targetRoom.id })
        .eq("id", assignment.id);

      if (updateError) throw updateError;

      toast.success(`Transferred to room ${roomNumber}`);
      onTransferComplete();
    } catch (error) {
      console.error("Error transferring item:", error);
      toast.error("Failed to transfer item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer {assignment.items.item_type}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Target Floor</Label>
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
            <Label>Target Room Number</Label>
            <Input
              placeholder="e.g., 1031"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Textarea
              placeholder="Why is this item being transferred?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleTransfer} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Transferring..." : "Transfer Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};