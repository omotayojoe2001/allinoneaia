import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CreditCard, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const PaymentSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    paystack_enabled: false,
    paystack_public_key: "",
    paystack_secret_key: "",
    flutterwave_enabled: false,
    flutterwave_public_key: "",
    flutterwave_secret_key: "",
    preferred_gateway: "paystack"
  });

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("payment_gateway_settings")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (data) {
      setSettings({
        paystack_enabled: data.paystack_enabled,
        paystack_public_key: data.paystack_public_key || "",
        paystack_secret_key: data.paystack_secret_key || "",
        flutterwave_enabled: data.flutterwave_enabled,
        flutterwave_public_key: data.flutterwave_public_key || "",
        flutterwave_secret_key: data.flutterwave_secret_key || "",
        preferred_gateway: data.preferred_gateway
      });
    }
  };

  const saveSettings = async () => {
    const { data: existing } = await supabase
      .from("payment_gateway_settings")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (existing) {
      await supabase
        .from("payment_gateway_settings")
        .update(settings)
        .eq("user_id", user?.id);
    } else {
      await supabase
        .from("payment_gateway_settings")
        .insert({ ...settings, user_id: user?.id });
    }

    toast({ title: "Success", description: "Payment settings saved" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Payment Gateway Settings
          </h1>
          <p className="text-sm text-muted-foreground">Configure Paystack and Flutterwave for invoice payments</p>
        </div>

        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Paystack</h2>
              <p className="text-sm text-muted-foreground">Accept payments via Paystack</p>
            </div>
            <Switch
              checked={settings.paystack_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, paystack_enabled: checked })}
            />
          </div>

          {settings.paystack_enabled && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Public Key</Label>
                <Input
                  type="text"
                  value={settings.paystack_public_key}
                  onChange={(e) => setSettings({ ...settings, paystack_public_key: e.target.value })}
                  placeholder="pk_test_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get from: <a href="https://dashboard.paystack.com/#/settings/developers" target="_blank" className="text-primary underline">Paystack Dashboard</a>
                </p>
              </div>
              <div>
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  value={settings.paystack_secret_key}
                  onChange={(e) => setSettings({ ...settings, paystack_secret_key: e.target.value })}
                  placeholder="sk_test_..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Flutterwave</h2>
              <p className="text-sm text-muted-foreground">Accept payments via Flutterwave</p>
            </div>
            <Switch
              checked={settings.flutterwave_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, flutterwave_enabled: checked })}
            />
          </div>

          {settings.flutterwave_enabled && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Public Key</Label>
                <Input
                  type="text"
                  value={settings.flutterwave_public_key}
                  onChange={(e) => setSettings({ ...settings, flutterwave_public_key: e.target.value })}
                  placeholder="FLWPUBK_TEST-..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get from: <a href="https://dashboard.flutterwave.com/settings/apis" target="_blank" className="text-primary underline">Flutterwave Dashboard</a>
                </p>
              </div>
              <div>
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  value={settings.flutterwave_secret_key}
                  onChange={(e) => setSettings({ ...settings, flutterwave_secret_key: e.target.value })}
                  placeholder="FLWSECK_TEST-..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Preferred Gateway</h2>
          <Select value={settings.preferred_gateway} onValueChange={(v) => setSettings({ ...settings, preferred_gateway: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paystack">Paystack</SelectItem>
              <SelectItem value="flutterwave">Flutterwave</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            This gateway will be used by default for generating payment links
          </p>
        </div>

        <Button onClick={saveSettings} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default PaymentSettings;
