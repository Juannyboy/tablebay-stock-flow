import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemType, setNewItemType] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemDescription, setNewItemDescription] = useState("");

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
      fetchFloorsAndRooms();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleAddItem = async () => {
    if (!selectedRoom || !newItemType.trim()) {
      toast.error("Please enter an item type");
      return;
    }

    try {
      const { error } = await supabase.from("needed_items").insert({
        room_id: selectedRoom.id,
        item_type: newItemType.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        description: newItemDescription.trim() || null,
        fulfilled: false,
      });

      if (error) throw error;

      toast.success("Item added to checklist");
      setNewItemType("");
      setNewItemQuantity("1");
      setNewItemDescription("");
      setShowAddItemDialog(false);
      fetchFloorsAndRooms();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("needed_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item removed");
      fetchFloorsAndRooms();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const filteredRooms = rooms.filter((room) => room.floor_id === selectedFloorId);

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
            Select floor, choose room, add and check off items
          </p>
        </div>

        {/* Floor Selector */}
        <Card className="mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredRooms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No rooms on this floor
                </CardContent>
              </Card>
            ) : (
              filteredRooms.map((room) => (
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
                    {room.needed_items.length === 0 ? (
                      "No items defined"
                    ) : (
                      <>
                        {room.needed_items.filter((i) => i.fulfilled).length} /{" "}
                        {room.needed_items.length} items
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>

          {/* Checklist */}
          <div className="lg:col-span-2">
            {selectedRoom ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        Room {selectedRoom.room_number} -{" "}
                        {selectedRoom.floor_display}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Add items needed and check them as they arrive
                      </p>
                    </div>
                    <Button onClick={() => setShowAddItemDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedRoom.needed_items.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      No items defined for this room. Click "Add Item" to start.
                    </div>
                  ) : (
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
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a room to manage its checklist
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add Item Dialog */}
        <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Item to Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="itemType">Item Type *</Label>
                <Input
                  id="itemType"
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value)}
                  placeholder="e.g., Headboard, Doorframe"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="e.g., Type 3, Queen size"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddItemDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoomChecklist;
