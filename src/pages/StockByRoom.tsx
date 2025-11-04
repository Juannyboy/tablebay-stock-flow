import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { AssignItemDialog } from "@/components/AssignItemDialog";

interface Item {
  id: string;
  item_type: string;
  description: string;
  quantity_total: number;
  quantity_assigned: number;
}

const StockByRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    fetchItems();

    // If coming from add stock page, auto-select the new item
    if (location.state?.newItemId) {
      const newItemId = location.state.newItemId;
      supabase
        .from("items")
        .select("*")
        .eq("id", newItemId)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedItem(data);
            setShowAssignDialog(true);
          }
        });
    }
  }, [location]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setItems(data);
  };

  const handleAssignClick = (item: Item) => {
    setSelectedItem(item);
    setShowAssignDialog(true);
  };

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

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stock by Room</h1>
            <p className="text-muted-foreground">Assign items to specific rooms</p>
          </div>
          <Button onClick={() => navigate("/add-stock")}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Stock
          </Button>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.item_type}</CardTitle>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAssignClick(item)}
                    disabled={item.quantity_assigned >= item.quantity_total}
                  >
                    Assign to Rooms
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="ml-2 font-semibold">{item.quantity_total}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Assigned:</span>
                    <span className="ml-2 font-semibold">{item.quantity_assigned}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Remaining:</span>
                    <span className="ml-2 font-semibold">
                      {item.quantity_total - item.quantity_assigned}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedItem && (
          <AssignItemDialog
            item={selectedItem}
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            onAssignComplete={() => {
              fetchItems();
              setShowAssignDialog(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StockByRoom;