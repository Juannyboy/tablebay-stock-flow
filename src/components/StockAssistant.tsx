import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export const StockAssistant = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("stock-assistant", {
        body: { question },
      });

      if (error) throw error;

      setAnswer(data.answer);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Ask about your stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="e.g., What rooms on floor 1 east have type 3 headboards?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAsk} disabled={loading} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Asking..." : "Ask"}
          </Button>
        </div>

        {answer && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
