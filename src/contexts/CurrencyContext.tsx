import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState("$");

  useEffect(() => {
    if (user) {
      fetchCurrency();
    }
  }, [user]);

  const fetchCurrency = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("default_currency")
      .eq("id", user?.id)
      .single();
    
    if (data?.default_currency) {
      setCurrencyState(data.default_currency);
    }
  };

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    if (user) {
      await supabase
        .from("profiles")
        .update({ default_currency: newCurrency })
        .eq("id", user.id);
    }
  };

  const formatAmount = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
