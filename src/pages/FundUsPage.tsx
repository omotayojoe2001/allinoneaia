import { Link } from "react-router-dom";
import { Sparkles, Heart, Rocket, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const tiers = [
  { icon: Heart, title: "Supporter", amount: "$5/mo", description: "Help us keep the lights on. Get early access to new features.", color: "text-pink-500" },
  { icon: Star, title: "Backer", amount: "$25/mo", description: "Fund development of new modules. Your name on our supporters page.", color: "text-yellow-500" },
  { icon: Rocket, title: "Champion", amount: "$100/mo", description: "Direct input on our roadmap. Priority support and exclusive beta access.", color: "text-primary" },
];

const FundUsPage = () => (
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
    <div className="max-w-4xl mx-auto px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-foreground mb-3">Fund the Future of BizSuiteAI</h1>
      <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
        We're building the most powerful all-in-one AI workspace. Your support helps us ship faster and stay independent.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card key={tier.title}>
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <tier.icon className={`w-6 h-6 ${tier.color}`} />
              </div>
              <CardTitle>{tier.title}</CardTitle>
              <div className="text-2xl font-bold text-foreground">{tier.amount}</div>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Support Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default FundUsPage;
