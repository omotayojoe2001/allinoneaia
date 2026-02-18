import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SpreadsheetAI() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }

    setLoading(true);
    // Placeholder for AI integration
    setTimeout(() => {
      setResult("AI analysis will be integrated here. Connect OpenAI or Gemini API for spreadsheet analysis, formula generation, and data insights.");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold mb-6">Spreadsheet AI</h1>

        <div className="glass-card rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">AI-Powered Spreadsheet Assistant</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ask AI to analyze data, generate formulas, create charts, or provide insights from your business data.
          </p>

          <Textarea
            placeholder="Example: Analyze my sales data and show trends..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="mb-4"
          />

          <Button onClick={handleAnalyze} disabled={loading} className="w-full">
            {loading ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </div>

        {result && (
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">AI Response</h3>
            <p className="text-sm text-muted-foreground">{result}</p>
          </div>
        )}

        <div className="glass-card rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Features (Coming Soon)</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Formula generation and explanation</li>
            <li>• Data analysis and insights</li>
            <li>• Chart and visualization creation</li>
            <li>• Automated data cleaning</li>
            <li>• Predictive analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
