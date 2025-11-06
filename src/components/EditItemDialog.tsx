import { useState } from "react";
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
import { toast } from "sonner";

interface Item {
  id: string;
  item_type: string;
  description: string;
  quantity_total: number;
  quantity_assigned: number;
}

interface EditItemDialogProps {
  item: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditComplete: () => void;
}

export const EditItemDialog = ({
  item,
  open,
  onOpenChange,
  onEditComplete,
}: EditItemDialogProps) => {
  const [itemType, setItemType] = useState(item.item_type);
  const [description, setDescription] = useState(item.description);
  const [quantity, setQuantity] = useState(item.quantity_total);
  const [addQuantity, setAddQuantity] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newTotalQuantity = quantity + addQuantity;
      
      const { error } = await supabase
        .from("items")
        .update({
          item_type: itemType,
          description,
          quantity_total: newTotalQuantity,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item updated successfully");
      onEditComplete();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>Update the item details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type</Label>
            <Input
              id="itemType"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Current Total Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={item.quantity_assigned}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              required
            />
            <p className="text-sm text-muted-foreground">
              Minimum: {item.quantity_assigned} (already assigned)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addQuantity">Add More Quantity</Label>
            <Input
              id="addQuantity"
              type="number"
              min={0}
              value={addQuantity}
              onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-muted-foreground">
              New total will be: {quantity + addQuantity}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Item"}
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
