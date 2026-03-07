const KCLAUT_API_KEY = import.meta.env.VITE_KCLAUT_API_KEY || '';
const KCLAUT_BASE_URL = "https://thekclaut.com/api/v2";
// KClaut API has CORS and HTTP/2 issues - use static data for now
// To enable API: Set USE_API=true and deploy your own backend proxy
const USE_API = true;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PROXY_URL = SUPABASE_URL + "/functions/v1/kclaut-proxy";

export interface KClautService {
  service: number;
  name: string;
  type: string;
  rate: string;  // This is in NGN (Nigerian Naira)
  min: string;
  max: string;
  category: string;
  refill?: boolean;
  cancel?: boolean;
}

export interface KClautOrder {
  order: number;
  charge: string;
  start_count: string;
  status: string;
  remains: string;
  currency: string;
}

class KClautAPI {
  private async makeRequest(action: string, params: any = {}) {
    if (!USE_API) {
      // Return mock/static data when API is disabled
      throw new Error('API calls disabled - using static data');
    }
    
    // Use Supabase Edge Function proxy
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ action, params })
    });
    return response.json();
  }

  async getServices(): Promise<KClautService[]> {
    const response = await this.makeRequest('services');
    // KClaut API returns services in a specific format, extract the array
    return Array.isArray(response) ? response : (response?.services || []);
  }

  async addOrder(service: number, link: string, quantity: number): Promise<{ order: number }> {
    return this.makeRequest('add', { service, link, quantity });
  }

  async getOrderStatus(order: number): Promise<KClautOrder> {
    return this.makeRequest('status', { order });
  }

  async getBalance(): Promise<{ balance: string; currency: string }> {
    return this.makeRequest('balance');
  }

  async getMultipleOrderStatus(orders: string): Promise<{ [key: string]: KClautOrder }> {
    return this.makeRequest('status', { orders });
  }
}

export const kclautAPI = new KClautAPI();

// Helper function to group services by platform
export const groupServicesByPlatform = (services: KClautService[]) => {
  const platforms: { [key: string]: KClautService[] } = {};
  
  services.forEach(service => {
    const platform = service.category || 'Other';
    if (!platforms[platform]) {
      platforms[platform] = [];
    }
    platforms[platform].push(service);
  });
  
  return platforms;
};

// Helper function to format price in NGN
export const formatPrice = (rate: string, currency: string = 'NGN') => {
  const price = parseFloat(rate);
  if (currency === 'NGN') {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
};