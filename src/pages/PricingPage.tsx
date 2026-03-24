import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import PricingSection from "@/components/PricingSection";
import ThemeToggle from "@/components/ThemeToggle";

const PricingPage = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-lg">BizSuiteAI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
          <Link to="/fund-us" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fund Us</Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="text-foreground text-sm font-medium hover:text-primary transition-colors">Log in</Link>
          <Link to="/signup" className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Start Free Trial</Link>
        </div>
      </div>
    </header>
    <div className="max-w-6xl mx-auto px-6 py-12">
      <PricingSection />
    </div>
  </div>
);

export default PricingPage;
