import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Package, 
  CheckCircle2, 
  TruckIcon,
  Wrench,
  BarChart3,
  Plus,
  CheckSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NeededItemDialog } from "@/components/NeededItemDialog";

interface DashboardStats {
  totalItems: number;
  buildingCount: number;
  builtCount: number;
  deliveringCount: number;
  inRoomCount: number;
  totalFloors: number;
  totalRooms: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    buildingCount: 0,
    builtCount: 0,
    deliveringCount: 0,
    inRoomCount: 0,
    totalFloors: 0,
    totalRooms: 0,
  });
  const [floors, setFloors] = useState<any[]>([]);
  const [neededItemDialogOpen, setNeededItemDialogOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchFloors();
  }, []);

  const fetchStats = async () => {
    const { data: assignments } = await supabase
      .from("item_assignments")
      .select("status");
    
    const { data: items } = await supabase
      .from("items")
      .select("quantity_total");
    
    const { data: floors } = await supabase
      .from("floors")
      .select("id");
    
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id");

    const totalItems = items?.reduce((sum, item) => sum + item.quantity_total, 0) || 0;
    const buildingCount = assignments?.filter(a => a.status === "building").length || 0;
    const builtCount = assignments?.filter(a => a.status === "built").length || 0;
    const deliveringCount = assignments?.filter(a => a.status === "delivering").length || 0;
    const inRoomCount = assignments?.filter(a => a.status === "in_room").length || 0;

    setStats({
      totalItems,
      buildingCount,
      builtCount,
      deliveringCount,
      inRoomCount,
      totalFloors: floors?.length || 0,
      totalRooms: rooms?.length || 0,
    });
  };

  const fetchFloors = async () => {
    const { data } = await supabase
      .from("floors")
      .select("*")
      .order("floor_number");
    
    if (data) setFloors(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "building": return "warning";
      case "built": return "info";
      case "delivering": return "secondary";
      case "in_room": return "success";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Table Bay Hotel Stock Control
          </h1>
          <p className="text-muted-foreground">Construction Stock Management System</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Building</CardTitle>
              <Wrench className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.buildingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivering</CardTitle>
              <TruckIcon className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveringCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Rooms</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inRoomCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Button 
            size="lg" 
            className="h-20"
            onClick={() => navigate("/add-stock")}
          >
            <Package className="mr-2 h-5 w-5" />
            Add New Stock
          </Button>
          <Button 
            size="lg" 
            className="h-20"
            variant="secondary"
            onClick={() => navigate("/stock-by-room")}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Stock by Room
          </Button>
          <Button 
            size="lg" 
            className="h-20"
            variant="secondary"
            onClick={() => navigate("/checklist")}
          >
            <CheckSquare className="mr-2 h-5 w-5" />
            Room Checklist
          </Button>
          <Button 
            size="lg" 
            className="h-20"
            variant="outline"
            onClick={() => setNeededItemDialogOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Request Items Not on Site
          </Button>
          <Button 
            size="lg" 
            className="h-20"
            variant="outline"
            onClick={() => navigate("/reports")}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            View Reports
          </Button>
        </div>

        {/* Floors Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Floors Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {floors.map((floor) => (
                <Button
                  key={floor.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => navigate(`/floor/${floor.id}`)}
                >
                  <Building2 className="h-8 w-8 mb-2 text-primary" />
                  <span className="font-semibold">{floor.display_name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <NeededItemDialog
          open={neededItemDialogOpen}
          onOpenChange={setNeededItemDialogOpen}
          onComplete={() => {
            setNeededItemDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;