import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const navigate = useNavigate();
  const [itemsReport, setItemsReport] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    // Items with assignments
    const { data: itemsData } = await supabase
      .from("items")
      .select(`
        *,
        item_assignments (
          id,
          status,
          rooms (
            room_number,
            floors (
              display_name
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (itemsData) setItemsReport(itemsData);

    // Recent transfers
    const { data: transfersData } = await supabase
      .from("item_transfers")
      .select(`
        *,
        item_assignments (
          items (
            item_type
          )
        ),
        from_room:rooms!item_transfers_from_room_id_fkey (
          room_number,
          floors (
            display_name
          )
        ),
        to_room:rooms!item_transfers_to_room_id_fkey (
          room_number,
          floors (
            display_name
          )
        )
      `)
      .order("transferred_at", { ascending: false })
      .limit(10);

    if (transfersData) setTransfers(transfersData);
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

  const getStatusLabel = (status: string) => {
    return status.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
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

        <h1 className="text-3xl font-bold mb-8">Reports & History</h1>

        {/* Items Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Items Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itemsReport.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{item.item_type}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div>Total: {item.quantity_total}</div>
                      <div>Assigned: {item.quantity_assigned}</div>
                    </div>
                  </div>
                  {item.item_assignments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.item_assignments.map((assignment: any) => (
                        <Badge key={assignment.id} variant={getStatusColor(assignment.status) as any}>
                          {assignment.rooms?.floors?.display_name} - Room {assignment.rooms?.room_number}: {getStatusLabel(assignment.status)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No transfers recorded yet
              </p>
            ) : (
              <div className="space-y-4">
                {transfers.map((transfer: any) => (
                  <div key={transfer.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {transfer.item_assignments?.items?.item_type}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          From: {transfer.from_room?.floors?.display_name} - Room {transfer.from_room?.room_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          To: {transfer.to_room?.floors?.display_name} - Room {transfer.to_room?.room_number}
                        </p>
                        {transfer.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {transfer.reason}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(transfer.transferred_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;