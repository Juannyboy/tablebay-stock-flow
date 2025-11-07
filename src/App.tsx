import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddStock from "./pages/AddStock";
import StockByRoom from "./pages/StockByRoom";
import FloorView from "./pages/FloorView";
import RoomView from "./pages/RoomView";
import Reports from "./pages/Reports";
import RoomChecklist from "./pages/RoomChecklist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-stock" element={<AddStock />} />
          <Route path="/stock-by-room" element={<StockByRoom />} />
          <Route path="/floor/:floorId" element={<FloorView />} />
          <Route path="/room/:roomId" element={<RoomView />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/room-checklist" element={<RoomChecklist />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
