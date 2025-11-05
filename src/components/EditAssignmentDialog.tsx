import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface Assignment {
  id: string;
  item_id: string;
  room_id: string;
}

interface Item {
  id: string;
  item_type: string;
  description: string;
  quantity_total: number;
  quantity_assigned: number;
}

interface EditAssignmentDialogProps {
  assignment: Assignment | null;
  currentItemType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditComplete: () => void;
}

export const EditAssignmentDialog = ({
  assignment,
  currentItemType,
  open,
  onOpenChange,
  onEditComplete,
}: EditAssignmentDialogProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchItems();
      if (assignment) {
        setSelectedItemId(assignment.item_id);
      }
    }
  }, [open, assignment]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("item_type");

    if (data) setItems(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignment || selectedItemId === assignment.item_id) {
      onOpenChange(false);
      return;
    }

    setLoading(true);

    try {
      // Get old and new items
      const oldItem = items.find(i => i.id === assignment.item_id);
      const newItem = items.find(i => i.id === selectedItemId);

      if (!oldItem || !newItem) {
        throw new Error("Items not found");
      }

      // Check if new item has available quantity
      if (newItem.quantity_assigned >= newItem.quantity_total) {
        toast.error("Selected item has no available quantity");
        return;
      }

      // Update assignment
      const { error: assignError } = await supabase
        .from("item_assignments")
        .update({ item_id: selectedItemId })
        .eq("id", assignment.id);

      if (assignError) throw assignError;

      // Update old item quantity
      const { error: oldItemError } = await supabase
        .from("items")
        .update({ quantity_assigned: oldItem.quantity_assigned - 1 })
        .eq("id", oldItem.id);

      if (oldItemError) throw oldItemError;

      // Update new item quantity
      const { error: newItemError } = await supabase
        .from("items")
        .update({ quantity_assigned: newItem.quantity_assigned + 1 })
        .eq("id", newItem.id);

      if (newItemError) throw newItemError;

      toast.success("Item assignment updated successfully");
      onEditComplete();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update item assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item Assignment</DialogTitle>
          <DialogDescription>
            Change which item is assigned to this room
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Item</Label>
            <p className="text-sm text-muted-foreground">{currentItemType}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newItem">New Item</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem 
                    key={item.id} 
                    value={item.id}
                    disabled={item.quantity_assigned >= item.quantity_total}
                  >
                    {item.item_type} (Available: {item.quantity_total - item.quantity_assigned})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Assignment"}
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
