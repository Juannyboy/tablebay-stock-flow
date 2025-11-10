import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface NeededItem {
  id: string;
  item_type: string;
  quantity: number;
  description?: string;
  fulfilled: boolean;
}

interface Room {
  id: string;
  room_number: string;
  floor_display: string;
}

const RoomDetail = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [neededItems, setNeededItems] = useState<NeededItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemType, setNewItemType] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemDescription, setNewItemDescription] = useState("");

  useEffect(() => {
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(`
          id,
          room_number,
          floors (
            display_name
          )
        `)
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      if (roomData) {
        setRoom({
          id: roomData.id,
          room_number: roomData.room_number,
          floor_display: (roomData.floors as any)?.display_name || "",
        });
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("needed_items")
        .select("*")
        .eq("room_id", roomId);

      if (itemsError) throw itemsError;

      setNeededItems(
        (itemsData || []).map((item) => ({
          id: item.id,
          item_type: item.item_type,
          quantity: item.quantity,
          description: item.description,
          fulfilled: item.fulfilled,
        }))
      );
    } catch (error) {
      console.error("Error fetching room data:", error);
      toast.error("Failed to load room data");
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
      fetchRoomData();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleAddItem = async () => {
    if (!roomId || !newItemType.trim()) {
      toast.error("Please enter an item type");
      return;
    }

    try {
      const { error } = await supabase.from("needed_items").insert({
        room_id: roomId,
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
      fetchRoomData();
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
      fetchRoomData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-4 md:p-6">Loading...</div>;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate("/checklist")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>
        <div className="mt-8 text-center text-muted-foreground">Room not found</div>
      </div>
    );
  }

  const fulfilledCount = neededItems.filter((i) => i.fulfilled).length;
  const totalCount = neededItems.length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/checklist")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl">
                  Room {room.room_number}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {room.floor_display}
                </p>
                {totalCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {fulfilledCount} / {totalCount} items received
                  </p>
                )}
              </div>
              <Button onClick={() => setShowAddItemDialog(true)} className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {neededItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No items defined for this room. Click "Add Item" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {neededItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                  >
                    <Checkbox
                      checked={item.fulfilled}
                      onCheckedChange={() =>
                        handleCheckItem(item.id, item.fulfilled)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

export default RoomDetail;
