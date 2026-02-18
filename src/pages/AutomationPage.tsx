import { Zap, Mail, MessageCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const automationTypes = [
  { 
    id: "email", 
    name: "Email Automation", 
    icon: Mail, 
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
    iconColor: "text-blue-500",
    description: "Email sequences, lists, subscribers & landing pages",
    count: 3
  },
  { 
    id: "whatsapp", 
    name: "WhatsApp Automation", 
    icon: MessageCircle, 
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
    iconColor: "text-green-500",
    description: "Bulk messages, drip campaigns & follow-ups",
    count: 2
  },
];

const AutomationPage = () => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-primary" /> Automation Hub
          </h1>
          <p className="text-muted-foreground">Select automation type to manage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {automationTypes.map((type) => (
            <Link
              key={type.id}
              to={`/automation/${type.id}`}
              className={`glass-card rounded-xl p-6 border-2 transition-all cursor-pointer ${type.color}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center`}>
                  <type.icon className={`w-6 h-6 ${type.iconColor}`} />
                </div>
                {type.count > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-background/50 text-foreground font-medium">
                    {type.count} active
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{type.name}</h3>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomationPage;
