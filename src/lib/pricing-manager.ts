import { supabase } from "@/lib/supabase";
import { kclautAPI, KClautService } from "./kclaut-api";
import { paystackService } from "./paystack";

export interface PricingRule {
  platform: string;
  service_type: string;
  markup_percentage: number;
  min_markup: number;
}

export interface OrderPricing {
  wholesale_cost: number;
  markup_percentage: number;
  user_price: number;
  profit: number;
}

class PricingManager {
  // Calculate user price with markup
  async calculatePricing(service: KClautService, quantity: number): Promise<OrderPricing> {
    // Rate is per 1000 units, so divide by 1000
    const wholesale_cost = (parseFloat(service.rate) / 1000) * quantity;
    
    // Get markup rule for this service
    const { data: rule } = await supabase
      .from("pricing_rules")
      .select("*")
      .or(`platform.eq.${service.category},platform.is.null`)
      .or(`service_type.ilike.%${this.getServiceType(service.name)}%,service_type.is.null`)
      .order("platform", { ascending: false })
      .limit(1)
      .single();

    const markup_percentage = rule?.markup_percentage || 50.00;
    const min_markup = rule?.min_markup || 1.00;
    
    const calculated_markup = (wholesale_cost * markup_percentage) / 100;
    const final_markup = Math.max(calculated_markup, min_markup);
    
    const user_price = wholesale_cost + final_markup;
    
    return {
      wholesale_cost,
      markup_percentage,
      user_price: Math.round(user_price * 100) / 100,
      profit: Math.round(final_markup * 100) / 100
    };
  }

  private getServiceType(serviceName: string): string {
    const name = serviceName.toLowerCase();
    if (name.includes('follower')) return 'Followers';
    if (name.includes('like')) return 'Likes';
    if (name.includes('view')) return 'Views';
    if (name.includes('subscriber')) return 'Subscribers';
    if (name.includes('comment')) return 'Comments';
    return 'Other';
  }

  // Update KClaut account balance
  async updateKClautBalance(): Promise<{ balance: string; currency: string }> {
    try {
      const balance = await kclautAPI.getBalance();
      
      await supabase
        .from("kclaut_account")
        .update({
          balance: parseFloat(balance.balance),
          currency: balance.currency,
          last_updated: new Date().toISOString()
        })
        .eq("id", (await supabase.from("kclaut_account").select("id").single()).data?.id);
      
      return balance;
    } catch (error) {
      console.error("Failed to update KClaut balance:", error);
      return { balance: "0", currency: "USD" };
    }
  }

  // Check if we have sufficient balance for order
  async checkSufficientBalance(wholesaleCost: number): Promise<boolean> {
    const { data } = await supabase
      .from("kclaut_account")
      .select("balance")
      .single();
    
    return (data?.balance || 0) >= wholesaleCost;
  }

  // Process order with payment
  async processOrder(
    userId: string,
    userEmail: string,
    service: KClautService,
    link: string,
    quantity: number
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const pricing = await this.calculatePricing(service, quantity);
      
      // Initialize Paystack payment
      const paymentResult = await paystackService.initializePayment(
        userEmail,
        pricing.user_price,
        {
          service_id: service.service,
          service_name: service.name,
          quantity,
          link,
        }
      );

      // Try to place order with KClaut
      let kclautOrderId = null;
      try {
        const kclautOrder = await kclautAPI.addOrder(service.service, link, quantity);
        kclautOrderId = kclautOrder.order;
      } catch (kclautError) {
        console.error("KClaut order failed:", kclautError);
        // Continue anyway - save as pending manual processing
      }
      
      // Save order to database (with or without KClaut order ID)
      const { data: order, error } = await supabase
        .from("social_orders")
        .insert({
          user_id: userId,
          kclaut_order_id: kclautOrderId,
          service_id: service.service,
          service_name: service.name,
          platform: service.category,
          link,
          quantity,
          wholesale_cost: pricing.wholesale_cost,
          markup_percentage: pricing.markup_percentage,
          user_price: pricing.user_price,
          profit: pricing.profit,
          payment_status: "completed",
          payment_intent_id: paymentResult.reference,
          status: kclautOrderId ? "pending" : "pending_manual"
        })
        .select()
        .single();

      if (error) throw error;

      // Update payment transaction with order ID
      await supabase
        .from("payment_transactions")
        .update({ order_id: order.id, status: "success" })
        .eq("reference", paymentResult.reference);

      // Update KClaut balance
      await this.updateKClautBalance();

      if (!kclautOrderId) {
        return { 
          success: true, 
          orderId: order.id,
          error: "Order saved but requires manual processing on KClaut" 
        };
      }

      return { success: true, orderId: order.id };
    } catch (error) {
      console.error("Order processing failed:", error);
      return { success: false, error: error instanceof Error ? error.message : "Order processing failed" };
    }
  }

  // Get pricing rules for admin
  async getPricingRules(): Promise<PricingRule[]> {
    const { data } = await supabase
      .from("pricing_rules")
      .select("*")
      .order("platform");
    
    return data || [];
  }

  // Update pricing rule
  async updatePricingRule(rule: Partial<PricingRule> & { id: string }): Promise<boolean> {
    const { error } = await supabase
      .from("pricing_rules")
      .update(rule)
      .eq("id", rule.id);
    
    return !error;
  }

  // Get KClaut account info
  async getKClautAccount(): Promise<{ balance: number; currency: string; last_updated: string }> {
    const { data } = await supabase
      .from("kclaut_account")
      .select("*")
      .single();
    
    return data || { balance: 0, currency: "USD", last_updated: new Date().toISOString() };
  }
}

export const pricingManager = new PricingManager();