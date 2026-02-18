import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Beginner",
    price: "Free",
    description: "Get started with basic AI tools",
    features: ["AI Chatbot (limited)", "5 automations/mo", "Basic content tools"],
    highlight: false,
  },
  {
    name: "Basic",
    price: "$19",
    description: "Essential tools for individuals",
    features: ["Unlimited chat", "50 automations/mo", "Content studio", "Social scheduling"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    description: "Full power for professionals",
    features: ["Everything in Basic", "Unlimited automations", "Video creation", "Business tools", "Priority support"],
    highlight: true,
  },
  {
    name: "Business",
    price: "$99",
    description: "Scale your team operations",
    features: ["Everything in Pro", "Team collaboration", "Custom workflows", "API access", "Dedicated support"],
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored for your organization",
    features: ["Everything in Business", "Custom integrations", "SLA guarantee", "On-premise option"],
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Start free, scale as you grow. All plans include core AI capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-lg p-5 flex flex-col ${
              plan.highlight
                ? "bg-primary/10 border-2 border-primary relative"
                : "glass-card border border-border"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-3 py-0.5 rounded-full font-medium">
                Popular
              </span>
            )}
            <h3 className="text-foreground font-semibold text-lg">{plan.name}</h3>
            <div className="mt-2 mb-1">
              <span className="text-2xl font-bold text-foreground">{plan.price}</span>
              {plan.price !== "Free" && plan.price !== "Custom" && (
                <span className="text-muted-foreground text-sm">/mo</span>
              )}
            </div>
            <p className="text-muted-foreground text-xs mb-4">{plan.description}</p>
            <ul className="space-y-2 mt-auto">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-5 w-full py-2 rounded-md text-sm font-medium transition-colors ${
                plan.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {plan.price === "Custom" ? "Contact Us" : "Get Started"}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
