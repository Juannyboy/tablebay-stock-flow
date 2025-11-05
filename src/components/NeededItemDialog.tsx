import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(roomId ? [roomId] : []);
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
    
    if (selectedRoomIds.length === 0) {
      toast.error("Please select at least one room");
      return;
    }
    
    setLoading(true);

    try {
      // Insert one record per selected room
      const insertData = selectedRoomIds.map(roomId => ({
        room_id: roomId,
        item_type: itemType,
        description,
        quantity,
        notes,
      }));

      const { error } = await supabase.from("needed_items").insert(insertData);

      if (error) throw error;

      toast.success(`Item request added for ${selectedRoomIds.length} room(s)`);
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
    setSelectedRoomIds(roomId ? [roomId] : []);
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
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
              <Label>Select Rooms</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                {rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No rooms found for this floor
                  </p>
                ) : (
                  rooms.map((room) => (
                    <div key={room.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={room.id}
                        checked={selectedRoomIds.includes(room.id)}
                        onCheckedChange={() => toggleRoom(room.id)}
                      />
                      <Label
                        htmlFor={room.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        Room {room.room_number}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedRoomIds.length} room(s) selected
              </p>
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
            <Button type="submit" disabled={loading || selectedRoomIds.length === 0} className="flex-1">
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
