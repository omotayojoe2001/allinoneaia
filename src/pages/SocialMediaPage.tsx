import { TrendingUp, ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SocialMediaPage = () => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--module-social))" }} /> Growth Services
          </h1>
          <p className="text-sm text-muted-foreground">Boost your social media presence with professional growth services</p>
        </div>

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
    </div>
  );
};

export default SocialMediaPage;
