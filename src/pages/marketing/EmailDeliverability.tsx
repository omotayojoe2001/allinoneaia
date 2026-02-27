import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Shield } from "lucide-react";

export default function EmailDeliverability() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [spamScore, setSpamScore] = useState<number | null>(null);
  const [reputation] = useState(85);

  const checkSpamScore = () => {
    let score = 0;
    if (content.includes("FREE") || content.includes("CLICK HERE")) score += 2;
    if (content.includes("!!!")) score += 1.5;
    if (content.length < 100) score += 1;
    if (!content.includes("unsubscribe")) score += 2;
    setSpamScore(Math.min(score, 10));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Email Deliverability</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sender Reputation</p>
              <p className="text-2xl font-bold">{reputation}/100</p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">DKIM Status</p>
              <p className="text-lg font-semibold text-green-600">Valid</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">SPF Status</p>
              <p className="text-lg font-semibold text-green-600">Valid</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Spam Score Checker</h3>
        <Textarea placeholder="Paste email content here..." value={content} onChange={e => setContent(e.target.value)} rows={8} />
        <Button onClick={checkSpamScore}>Check Spam Score</Button>
        {spamScore !== null && (
          <div className={`p-4 rounded ${spamScore < 3 ? "bg-green-50" : spamScore < 6 ? "bg-yellow-50" : "bg-red-50"}`}>
            <p className="font-semibold">Spam Score: {spamScore}/10</p>
            <p className="text-sm">{spamScore < 3 ? "Good - Low spam risk" : spamScore < 6 ? "Fair - Moderate risk" : "Poor - High spam risk"}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
