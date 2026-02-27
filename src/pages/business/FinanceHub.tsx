import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Cashbook from "./Cashbook";
import InvoiceGenerator from "./InvoiceGenerator";
import InvoiceReminders from "./InvoiceReminders";
import Bookkeeping from "./Bookkeeping";
import PaymentSettings from "./PaymentSettings";

const FinanceHub = () => {
  const [active, setActive] = useState("cashbook");

  const tabs = [
    { id: "cashbook", label: "Cashbook", component: Cashbook },
    { id: "invoices", label: "Invoices", component: InvoiceGenerator },
    { id: "reminders", label: "Reminders", component: InvoiceReminders },
    { id: "bookkeeping", label: "Bookkeeping", component: Bookkeeping },
    { id: "payment", label: "Payment", component: PaymentSettings },
  ];

  const ActiveComponent = tabs.find(t => t.id === active)?.component;

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-background px-6 py-3 flex gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-all flex items-center gap-1 ${
              active === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
            {active === tab.id && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default FinanceHub;
