import { Share2, Calendar, TrendingUp, Users, ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const tabs = ["Overview", "Scheduler", "Growth Services", "Analytics"] as const;

const scheduledPosts = [
  { platform: "Instagram", content: "New product launch 🚀", status: "Scheduled", time: "Today 5:00 PM" },
  { platform: "Twitter", content: "Thread: AI trends in 2026", status: "Published", time: "Today 10:00 AM" },
  { platform: "LinkedIn", content: "Company milestone update", status: "Draft", time: "—" },
  { platform: "TikTok", content: "Behind the scenes video", status: "Scheduled", time: "Tomorrow 12:00 PM" },
];

const growthServices = [
  { platform: "Instagram", services: [
    { name: "Followers", options: [{ qty: "1,000", price: "$12" }, { qty: "5,000", price: "$45" }, { qty: "10,000", price: "$79" }] },
    { name: "Likes", options: [{ qty: "500", price: "$5" }, { qty: "2,000", price: "$15" }, { qty: "5,000", price: "$30" }] },
  ]},
  { platform: "TikTok", services: [
    { name: "Followers", options: [{ qty: "1,000", price: "$10" }, { qty: "5,000", price: "$38" }, { qty: "10,000", price: "$65" }] },
    { name: "Views", options: [{ qty: "10,000", price: "$8" }, { qty: "50,000", price: "$25" }, { qty: "100,000", price: "$45" }] },
  ]},
  { platform: "YouTube", services: [
    { name: "Subscribers", options: [{ qty: "500", price: "$20" }, { qty: "2,000", price: "$60" }, { qty: "5,000", price: "$130" }] },
    { name: "Views", options: [{ qty: "5,000", price: "$12" }, { qty: "20,000", price: "$35" }, { qty: "50,000", price: "$70" }] },
  ]},
  { platform: "Facebook", services: [
    { name: "Page Likes", options: [{ qty: "1,000", price: "$15" }, { qty: "5,000", price: "$55" }, { qty: "10,000", price: "$90" }] },
  ]},
  { platform: "Twitter / X", services: [
    { name: "Followers", options: [{ qty: "1,000", price: "$14" }, { qty: "5,000", price: "$50" }, { qty: "10,000", price: "$85" }] },
  ]},
];

const SocialMediaPage = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Overview");

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
              <Share2 className="w-5 h-5" style={{ color: "hsl(var(--module-social))" }} /> Social Media Growth Hub
            </h1>
            <p className="text-sm text-muted-foreground">Manage, schedule, grow, and monetize your social presence</p>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary/50 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "Overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Followers", value: "24.5K", change: "+1.2K this month" },
                { label: "Posts This Week", value: "12", change: "3 scheduled" },
                { label: "Engagement Rate", value: "4.8%", change: "+0.3%" },
                { label: "Platforms Connected", value: "5", change: "All active" },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-lg p-4">
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xs text-primary mt-1">{s.change}</div>
                </div>
              ))}
            </div>
            <h3 className="text-foreground font-semibold mb-3">Recent Posts</h3>
            <div className="space-y-2">
              {scheduledPosts.map((p) => (
                <div key={p.content} className="glass-card rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.content}</p>
                    <p className="text-xs text-muted-foreground">{p.platform} · {p.time}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${p.status === "Published" ? "bg-green-500/15 text-green-400" : p.status === "Scheduled" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduler */}
        {activeTab === "Scheduler" && (
          <div className="glass-card rounded-lg p-8 text-center">
            <Calendar className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-foreground font-semibold mb-1">Post Scheduler</h3>
            <p className="text-sm text-muted-foreground mb-4">Schedule and manage posts across all platforms from one calendar</p>
            <button className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Open Calendar
            </button>
          </div>
        )}

        {/* Growth Services */}
        {activeTab === "Growth Services" && (
          <div className="space-y-6">
            <div className="glass-card rounded-lg p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Professional Growth Services</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Access 337+ real services for Instagram, TikTok, Facebook, YouTube, LinkedIn, and more. 
                Real-time pricing, instant delivery, and profit tracking.
              </p>
              <Link to="/social/growth">
                <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-base font-semibold hover:bg-primary/90 transition-colors flex items-center gap-3 mx-auto">
                  <ShoppingCart className="w-5 h-5" /> Browse All Services
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">337+</div>
                  <div className="text-xs text-muted-foreground">Services Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">15+</div>
                  <div className="text-xs text-muted-foreground">Platforms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">60%</div>
                  <div className="text-xs text-muted-foreground">Your Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Instant</div>
                  <div className="text-xs text-muted-foreground">Delivery</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === "Analytics" && (
          <div className="glass-card rounded-lg p-8 text-center">
            <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-foreground font-semibold mb-1">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">Track engagement, growth, and performance across all platforms</p>
            <button className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              View Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaPage;
