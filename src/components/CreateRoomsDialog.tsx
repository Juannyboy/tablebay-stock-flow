import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { X } from "lucide-react";

interface CreateRoomsDialogProps {
  floorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomsCreated: () => void;
}

export const CreateRoomsDialog = ({
  floorId,
  open,
  onOpenChange,
  onRoomsCreated,
}: CreateRoomsDialogProps) => {
  const [roomNumbers, setRoomNumbers] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const handleAddRoom = () => {
    setRoomNumbers([...roomNumbers, ""]);
  };

  const handleRemoveRoom = (index: number) => {
    setRoomNumbers(roomNumbers.filter((_, i) => i !== index));
  };

  const handleRoomNumberChange = (index: number, value: string) => {
    const newRoomNumbers = [...roomNumbers];
    newRoomNumbers[index] = value;
    setRoomNumbers(newRoomNumbers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validRoomNumbers = roomNumbers.filter(num => num.trim() !== "");
      
      if (validRoomNumbers.length === 0) {
        toast.error("Please enter at least one room number");
        setLoading(false);
        return;
      }

      // Check for existing rooms
      const { data: existingRooms } = await supabase
        .from("rooms")
        .select("room_number")
        .eq("floor_id", floorId)
        .in("room_number", validRoomNumbers);

      const existingRoomNumbers = existingRooms?.map(r => r.room_number) || [];
      const newRoomNumbers = validRoomNumbers.filter(num => !existingRoomNumbers.includes(num));

      if (newRoomNumbers.length === 0) {
        toast.error("All room numbers already exist on this floor");
        setLoading(false);
        return;
      }

      // Insert new rooms
      const roomsToInsert = newRoomNumbers.map(room_number => ({
        floor_id: floorId,
        room_number,
      }));

      const { error } = await supabase
        .from("rooms")
        .insert(roomsToInsert);

      if (error) throw error;

      toast.success(`${newRoomNumbers.length} room(s) created successfully`);
      if (existingRoomNumbers.length > 0) {
        toast.info(`${existingRoomNumbers.length} room(s) already existed and were skipped`);
      }
      
      setRoomNumbers([""]);
      onRoomsCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating rooms:", error);
      toast.error("Failed to create rooms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Rooms</DialogTitle>
          <DialogDescription>Add room numbers for this floor</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {roomNumbers.map((roomNum, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`room-${index}`}>Room Number {index + 1}</Label>
                  <Input
                    id={`room-${index}`}
                    value={roomNum}
                    onChange={(e) => handleRoomNumberChange(index, e.target.value)}
                    placeholder="e.g., 101, 102, etc."
                  />
                </div>
                {roomNumbers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRoom(index)}
                    className="mt-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddRoom}
            className="w-full"
          >
            Add Another Room
          </Button>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Rooms"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
