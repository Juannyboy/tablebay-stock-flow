import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface NeededItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  roomId?: string;
}

interface Floor {
  id: string;
  display_name: string;
  floor_number: string;
}

interface Room {
  id: string;
  room_number: string;
}

export const NeededItemDialog = ({
  open,
  onOpenChange,
  onComplete,
  roomId,
}: NeededItemDialogProps) => {
  const [itemType, setItemType] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || "");
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFloors();
  }, []);

  useEffect(() => {
    if (selectedFloorId) {
      fetchRooms(selectedFloorId);
    }
  }, [selectedFloorId]);

  const fetchFloors = async () => {
    const { data } = await supabase
      .from("floors")
      .select("*")
      .order("floor_number");
    if (data) setFloors(data);
  };

  const fetchRooms = async (floorId: string) => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("floor_id", floorId)
      .order("room_number");
    if (data) setRooms(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("needed_items").insert({
        room_id: selectedRoomId,
        item_type: itemType,
        description,
        quantity,
        notes,
      });

      if (error) throw error;

      toast.success("Needed item added successfully");
      onComplete();
      resetForm();
    } catch (error) {
      console.error("Error adding needed item:", error);
      toast.error("Failed to add needed item");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setItemType("");
    setDescription("");
    setQuantity(1);
    setNotes("");
    setSelectedFloorId("");
    setSelectedRoomId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Items Not on Site</DialogTitle>
          <DialogDescription>
            Add items that are needed but not yet on site
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type</Label>
            <Input
              id="itemType"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              placeholder="e.g., BIC Type 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Needed</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor">Floor</Label>
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

          {selectedFloorId && (
            <div className="space-y-2">
              <Label htmlFor="room">Room Number</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !selectedRoomId} className="flex-1">
              {loading ? "Adding..." : "Add Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
