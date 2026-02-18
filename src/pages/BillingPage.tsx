import { CreditCard } from "lucide-react";
import PricingSection from "@/components/PricingSection";

const BillingPage = () => (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
        <CreditCard className="w-5 h-5 text-primary" /> Billing
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your subscription and credits</p>

      <div className="glass-card rounded-lg p-5 mb-8">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-lg font-bold text-foreground">Pro Plan</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">Active</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">$49/mo · Renews Mar 15, 2026</p>
        <div className="w-full bg-secondary rounded-full h-2 mb-1">
          <div className="h-2 rounded-full bg-primary" style={{ width: "62%" }} />
        </div>
        <p className="text-xs text-muted-foreground">62% of monthly credits used (310 / 500)</p>
      </div>

      <PricingSection />
    </div>
  </div>
);

export default BillingPage;
