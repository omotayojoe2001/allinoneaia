import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Book, Video, MessageCircle, Search, ChevronRight } from "lucide-react";

export default function HelpCenter() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicket, setNewTicket] = useState({ subject: "", description: "" });
  const [activeView, setActiveView] = useState("articles");

  useEffect(() => {
    loadArticles();
    loadTickets();
  }, []);

  const loadArticles = async () => {
    const { data } = await supabase.from("kb_articles").select("*").eq("is_published", true).limit(10);
    if (data) setArticles(data);
  };

  const loadTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setTickets(data);
  };

  const createTicket = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("support_tickets").insert({
      user_id: user.id,
      ticket_number: `TKT-${Date.now()}`,
      ...newTicket
    });

    toast({ title: "Success", description: "Support ticket created" });
    setNewTicket({ subject: "", description: "" });
    loadTickets();
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Help Center</h1>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <Input placeholder="Search for help..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="mb-4 flex gap-1">
        {[
          { id: "articles", label: "Articles", icon: Book },
          { id: "support", label: "Support", icon: MessageCircle },
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`px-4 py-2 text-sm font-medium rounded transition-all flex items-center gap-1 ${
              activeView === view.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.label}
            {activeView === view.id && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {activeView === "articles" && (
        <div className="space-y-3">
          {filteredArticles.map(article => (
            <Card key={article.id} className="p-4">
              <h3 className="font-semibold mb-2">{article.title}</h3>
              <p className="text-sm text-muted-foreground">{article.content.substring(0, 150)}...</p>
            </Card>
          ))}
        </div>
      )}

      {activeView === "support" && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Create Support Ticket</h3>
            <Input placeholder="Subject" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} />
            <Textarea placeholder="Description" value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} />
            <Button onClick={createTicket}>Submit Ticket</Button>
          </Card>

          <div className="space-y-2">
            {tickets.map(ticket => (
              <Card key={ticket.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">{ticket.ticket_number}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    ticket.status === "open" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}>{ticket.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
