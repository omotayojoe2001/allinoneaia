import { Palette, FileText, Image, Video, Youtube, Mic, Plus, ArrowRight, FileEdit, CheckCircle2, Presentation, TrendingUp, Cpu, VideoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tools = [
  { name: "AI Writer", desc: "Generate blog posts, captions, ad copy, scripts, and more with AI", icon: FileText, count: "8 created today", action: "Start Writing" },
  { name: "Document Editor", desc: "Edit documents, reports, and articles with AI-powered suggestions", icon: FileEdit, count: "5 edited", action: "Edit Document" },
  { name: "Grammar Check", desc: "Check and fix grammar, spelling, punctuation, and style issues", icon: CheckCircle2, count: "12 checked", action: "Check Grammar" },
  { name: "Presentation", desc: "Create professional presentations and slide decks with AI assistance", icon: Presentation, count: "3 created", action: "Create Presentation" },
  { name: "SEO & Marketing AI", desc: "Optimize content for search engines and generate marketing copy", icon: TrendingUp, count: "6 optimized", action: "Optimize SEO" },
  { name: "LM Studio", desc: "Run local AI models for free - privacy-focused content generation", icon: Cpu, count: "Free", action: "Launch Studio" },
  { name: "Video Creator", desc: "Create full videos from scripts with AI voiceovers and visuals", icon: VideoIcon, count: "2 created", action: "Create Video" },
  { name: "Image Generator", desc: "Create stunning graphics, thumbnails, banners, and social visuals from text prompts", icon: Image, count: "3 generated", action: "Generate Image" },
  { name: "Video Editor", desc: "Edit, trim, and enhance video content with AI-powered tools", icon: Video, count: "1 in progress", action: "Edit Video" },
  { name: "Shorts Creator", desc: "Auto-generate short-form videos for TikTok, Instagram Reels, YouTube Shorts, and more", icon: Youtube, count: "2 this week", action: "Create Short" },
  { name: "Voiceover AI", desc: "Generate natural-sounding voiceovers in multiple languages and voices", icon: Mic, count: "4 generated", action: "Create Voiceover" },
];

const recentContent = [
  { title: "AI in 2026 — Blog Post", type: "AI Writer", status: "Published", time: "Today 10:00 AM" },
  { title: "Product Launch Banner", type: "Image", status: "Completed", time: "Today 9:15 AM" },
  { title: "Instagram Reel — Tips", type: "Short", status: "Rendering", time: "Today 8:30 AM" },
  { title: "Podcast Intro Voiceover", type: "Voiceover", status: "Completed", time: "Yesterday" },
];

const ContentStudioPage = () => {
  const navigate = useNavigate();

  const handleToolClick = (toolName: string) => {
    const routes: Record<string, string> = {
      'Grammar Check': '/content/grammar',
      'AI Writer': '/content/writer',
      'Voiceover AI': '/content/voiceover',
    };
    if (routes[toolName]) {
      navigate(routes[toolName]);
    }
  };

  return (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5" style={{ color: "hsl(var(--module-content))" }} /> Content Studio
          </h1>
          <p className="text-sm text-muted-foreground">Your complete AI-powered content creation hub</p>
        </div>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tools.map((t) => (
          <div key={t.name} className="glass-card rounded-lg p-5 flex flex-col justify-between hover:border-primary/30 transition-colors group">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--module-content) / 0.12)" }}>
                  <t.icon className="w-5 h-5" style={{ color: "hsl(var(--module-content))" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.count}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t.desc}</p>
            </div>
            <button 
              onClick={() => handleToolClick(t.name)}
              className="w-full py-2 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> {t.action}
            </button>
          </div>
        ))}
      </div>

      {/* Recent Content */}
      <h2 className="text-foreground font-semibold mb-3">Recent Content</h2>
      <div className="space-y-2">
        {recentContent.map((c) => (
          <div key={c.title} className="glass-card rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.type} · {c.time}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${c.status === "Published" || c.status === "Completed" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default ContentStudioPage;
