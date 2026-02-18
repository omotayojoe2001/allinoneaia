import { Bot, Plus, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const WhatsAppChatbots = () => {
  const bots = [
    { id: 1, name: "Sales Bot", status: "active", conversations: 1205, lastActive: "Just now" },
    { id: 2, name: "Customer Onboarding", status: "draft", conversations: 0, lastActive: "—" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to platforms
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">WhatsApp Chatbots</h1>
            <p className="text-sm text-muted-foreground">Manage your WhatsApp Business API bots</p>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Bot
          </button>
        </div>

        <div className="space-y-3">
          {bots.map((bot) => (
            <div key={bot.id} className="glass-card rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{bot.name}</p>
                  <p className="text-xs text-muted-foreground">{bot.conversations} conversations · {bot.lastActive}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full ${bot.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-secondary text-muted-foreground'}`}>
                  {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                </span>
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatbots;
