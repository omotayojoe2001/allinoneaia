import { Link } from "react-router-dom";
import { Sparkles, Mail, MessageSquare, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const supportOptions = [
  { icon: MessageSquare, title: "Live Chat", description: "Chat with our support team in real-time during business hours.", action: "Start Chat" },
  { icon: Mail, title: "Email Support", description: "Send us a detailed message and we'll respond within 24 hours.", action: "Send Email" },
  { icon: FileText, title: "Documentation", description: "Browse our comprehensive guides, tutorials, and FAQs.", action: "View Docs" },
];

const SupportPage = () => (
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
      <h1 className="text-3xl font-bold text-foreground mb-3">How can we help?</h1>
      <p className="text-muted-foreground mb-12">Choose the best way to reach our team.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportOptions.map((opt) => (
          <Card key={opt.title} className="text-left">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <opt.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{opt.title}</CardTitle>
              <CardDescription>{opt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">{opt.action}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default SupportPage;
