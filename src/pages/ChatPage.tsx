import { Bot, MessageCircle, Send, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const ChatPage = () => {
  const { user } = useAuth();
  const [whatsappCount, setWhatsappCount] = useState(0);
  const [telegramCount, setTelegramCount] = useState(0);
  const [webCount, setWebCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadCounts();
    }
  }, [user]);

  const loadCounts = async () => {
    const [whatsapp, telegram, web] = await Promise.all([
      supabase.from('chatbots').select('id', { count: 'exact' }).eq('user_id', user?.id).eq('platform', 'whatsapp'),
      supabase.from('chatbots').select('id', { count: 'exact' }).eq('user_id', user?.id).eq('platform', 'telegram'),
      supabase.from('chatbots').select('id', { count: 'exact' }).eq('user_id', user?.id).eq('platform', 'web')
    ]);
    setWhatsappCount(whatsapp.count || 0);
    setTelegramCount(telegram.count || 0);
    setWebCount(web.count || 0);
  };

  const platforms = [
    { 
      id: "whatsapp", 
      name: "WhatsApp", 
      icon: MessageCircle, 
      color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
      iconColor: "text-green-500",
      description: "Build chatbots for WhatsApp Business API",
      count: whatsappCount
    },
    { 
      id: "telegram", 
      name: "Telegram", 
      icon: Send, 
      color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
      iconColor: "text-blue-500",
      description: "Create Telegram bots for your channels",
      count: telegramCount
    },
    { 
      id: "web", 
      name: "Web Widget", 
      icon: Globe, 
      color: "bg-primary/10 hover:bg-primary/20 border-primary/20",
      iconColor: "text-primary",
      description: "Embed chat widgets on your website",
      count: webCount
    },
  ];
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Bot className="w-6 h-6 text-primary" /> Chatbot Builder
          </h1>
          <p className="text-muted-foreground">Select a platform to manage your chatbots</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <Link
              key={platform.id}
              to={`/chat/${platform.id}`}
              className={`glass-card rounded-xl p-6 border-2 transition-all cursor-pointer ${platform.color}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center`}>
                  <platform.icon className={`w-6 h-6 ${platform.iconColor}`} />
                </div>
                {platform.count > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-background/50 text-foreground font-medium">
                    {platform.count} bot{platform.count > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{platform.name}</h3>
              <p className="text-sm text-muted-foreground">{platform.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
