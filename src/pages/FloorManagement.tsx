import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Floor {
  id: string;
  floor_number: string;
  display_name: string;
  created_at: string;
}

const FloorManagement = () => {
  const navigate = useNavigate();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorNumber, setFloorNumber] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    fetchFloors();
  }, []);

  const fetchFloors = async () => {
    try {
      const { data, error } = await supabase
        .from("floors")
        .select("*")
        .order("floor_number");

      if (error) throw error;
      setFloors(data || []);
    } catch (error) {
      console.error("Error fetching floors:", error);
      toast.error("Failed to load floors");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFloor = async () => {
    if (!floorNumber.trim() || !displayName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase.from("floors").insert({
        floor_number: floorNumber.trim(),
        display_name: displayName.trim(),
      });

      if (error) throw error;

      toast.success("Floor created successfully");
      setFloorNumber("");
      setDisplayName("");
      setShowAddDialog(false);
      fetchFloors();
    } catch (error) {
      console.error("Error creating floor:", error);
      toast.error("Failed to create floor");
    }
  };

  const handleEditFloor = async () => {
    if (!editingFloor || !floorNumber.trim() || !displayName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("floors")
        .update({
          floor_number: floorNumber.trim(),
          display_name: displayName.trim(),
        })
        .eq("id", editingFloor.id);

      if (error) throw error;

      toast.success("Floor updated successfully");
      setEditingFloor(null);
      setFloorNumber("");
      setDisplayName("");
      setShowEditDialog(false);
      fetchFloors();
    } catch (error) {
      console.error("Error updating floor:", error);
      toast.error("Failed to update floor");
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm("Are you sure you want to delete this floor? This will also delete all rooms on this floor.")) {
      return;
    }

    try {
      const { error } = await supabase.from("floors").delete().eq("id", floorId);

      if (error) throw error;

      toast.success("Floor deleted successfully");
      fetchFloors();
    } catch (error) {
      console.error("Error deleting floor:", error);
      toast.error("Failed to delete floor");
    }
  };

  const openEditDialog = (floor: Floor) => {
    setEditingFloor(floor);
    setFloorNumber(floor.floor_number);
    setDisplayName(floor.display_name);
    setShowEditDialog(true);
  };

  const openAddDialog = () => {
    setFloorNumber("");
    setDisplayName("");
    setShowAddDialog(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-4 md:p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 md:mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Floor Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Create and manage building floors
            </p>
          </div>
          <Button onClick={openAddDialog} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Floor
          </Button>
        </div>

        {floors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No floors created yet</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Floor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {floors.map((floor) => (
              <Card key={floor.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">
                        {floor.display_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Floor {floor.floor_number}
                      </p>
                    </div>
                    <Building2 className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(floor)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFloor(floor.id)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Floor Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Floor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="floorNumber">Floor Number *</Label>
                <Input
                  id="floorNumber"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  placeholder="e.g., 1, 2, G, B1"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Ground Floor, First Floor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFloor}>Add Floor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Floor Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Floor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFloorNumber">Floor Number *</Label>
                <Input
                  id="editFloorNumber"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  placeholder="e.g., 1, 2, G, B1"
                />
              </div>
              <div>
                <Label htmlFor="editDisplayName">Display Name *</Label>
                <Input
                  id="editDisplayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Ground Floor, First Floor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditFloor}>Update Floor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FloorManagement;
