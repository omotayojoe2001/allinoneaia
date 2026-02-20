import { Share2, Calendar, TrendingUp, Users, ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const tabs = ["Overview", "Scheduler", "Growth Services", "Analytics"] as const;

const SocialMediaPage = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Overview");
  const [posts, setPosts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: postsData } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);

    const { data: ordersData } = await supabase
      .from('social_orders')
      .select('*')
      .eq('user_id', user.id);

    if (postsData) setPosts(postsData);
    if (ordersData) setOrders(ordersData);
  };

  const stats = {
    totalFollowers: orders.filter(o => o.service_name?.includes('Follower')).reduce((sum, o) => sum + (o.quantity || 0), 0),
    postsThisWeek: posts.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + (o.total_price || 0), 0)
  };

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
          <button 
            onClick={() => navigate('/social/scheduler')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
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
              <div className="glass-card rounded-lg p-4">
                <div className="text-xl font-bold text-foreground">{stats.totalFollowers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Growth Orders</div>
                <div className="text-xs text-primary mt-1">From {stats.totalOrders} orders</div>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="text-xl font-bold text-foreground">{stats.postsThisWeek}</div>
                <div className="text-xs text-muted-foreground">Posts This Week</div>
                <div className="text-xs text-primary mt-1">{stats.scheduledPosts} scheduled</div>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="text-xl font-bold text-foreground">₦{stats.totalSpent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Spent</div>
                <div className="text-xs text-primary mt-1">On growth services</div>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="text-xl font-bold text-foreground">{stats.totalOrders}</div>
                <div className="text-xs text-muted-foreground">Active Orders</div>
                <div className="text-xs text-primary mt-1">All platforms</div>
              </div>
            </div>
            <h3 className="text-foreground font-semibold mb-3">Recent Posts</h3>
            <div className="space-y-2">
              {posts.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                  <button 
                    onClick={() => navigate('/social/scheduler')}
                    className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
                  >
                    Create Post
                  </button>
                </div>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.content}</p>
                      <p className="text-xs text-muted-foreground">{p.platform} · {new Date(p.scheduled_time).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${
                      p.status === 'published' ? 'bg-green-500/15 text-green-400' : 
                      p.status === 'scheduled' ? 'bg-primary/15 text-primary' : 
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Scheduler */}
        {activeTab === "Scheduler" && (
          <div className="glass-card rounded-lg p-8 text-center">
            <Calendar className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-foreground font-semibold mb-1">Post Scheduler</h3>
            <p className="text-sm text-muted-foreground mb-4">Schedule and manage posts across Twitter/X and LinkedIn</p>
            <button 
              onClick={() => navigate('/social/scheduler')}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Open Scheduler
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
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="glass-card rounded-lg p-4">
                <div className="text-2xl font-bold text-foreground">{stats.totalOrders}</div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
                <div className="text-xs text-primary mt-1">All time</div>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="text-2xl font-bold text-foreground">₦{stats.totalSpent.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
                <div className="text-xs text-primary mt-1">On services</div>
              </div>
              <div className="glass-card rounded-lg p-4">
                <div className="text-2xl font-bold text-foreground">{stats.totalFollowers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Growth Delivered</div>
                <div className="text-xs text-primary mt-1">Followers/Likes/Views</div>
              </div>
            </div>
            <h3 className="text-foreground font-semibold mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="glass-card rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No orders yet. Browse growth services!</p>
                  <button 
                    onClick={() => navigate('/social/growth')}
                    className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm"
                  >
                    Browse Services
                  </button>
                </div>
              ) : (
                orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.service_name}</p>
                      <p className="text-xs text-muted-foreground">{order.quantity} units · ₦{order.total_price}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${
                      order.status === 'completed' ? 'bg-green-500/15 text-green-400' : 
                      order.status === 'processing' ? 'bg-blue-500/15 text-blue-400' : 
                      'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaPage;
