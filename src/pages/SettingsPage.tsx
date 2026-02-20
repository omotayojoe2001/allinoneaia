import { useState, useEffect } from "react";
import { Settings, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState({ first_name: "", last_name: "", email: "" });
  const [form, setForm] = useState({
    business_name: "",
    business_address: "",
    business_phone: "",
    business_whatsapp: "",
    business_motto: "",
    business_logo_url: "",
    default_currency: "USD",
    invoice_theme: "blue",
    tax_rate: ""
  });
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      // Check localStorage first
      const saved = localStorage.getItem(`settings_draft_${user.id}`);
      if (saved) {
        const draft = JSON.parse(saved);
        setForm(draft);
        setHasChanges(true);
      } else {
        // Only load from database if no draft exists
        loadProfile();
      }
    }
  }, [user]);

  useEffect(() => {
    // Save to localStorage whenever form changes
    if (user && hasChanges) {
      localStorage.setItem(`settings_draft_${user.id}`, JSON.stringify(form));
    }
  }, [form, hasChanges, user]);

  useEffect(() => {
    // Auto-save when user navigates away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
    if (data) {
      setUserInfo({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: user?.email || ""
      });
      setForm({
        business_name: data.business_name || "",
        business_address: data.business_address || "",
        business_phone: data.business_phone || "",
        business_whatsapp: data.business_whatsapp || "",
        business_motto: data.business_motto || "",
        business_logo_url: data.business_logo_url || "",
        default_currency: data.default_currency || "USD",
        invoice_theme: data.invoice_theme || "blue",
        tax_rate: data.tax_rate || ""
      });
    }
  };

  const handleSave = async () => {
    const { error } = await supabase.from("profiles").update({
      business_name: form.business_name,
      business_address: form.business_address,
      business_phone: form.business_phone,
      business_whatsapp: form.business_whatsapp,
      business_motto: form.business_motto,
      business_logo_url: form.business_logo_url,
      default_currency: form.default_currency,
      invoice_theme: form.invoice_theme,
      tax_rate: form.tax_rate ? parseFloat(form.tax_rate) : 0
    }).eq("id", user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Settings saved" });
      setHasChanges(false);
      // Clear localStorage draft after successful save
      if (user) localStorage.removeItem(`settings_draft_${user.id}`);
      loadProfile();
    }
  };

  const updateForm = (updates: any) => {
    setForm({ ...form, ...updates });
    setHasChanges(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
    updateForm({ business_logo_url: publicUrl });
    setUploading(false);
    toast({ title: "Success", description: "Logo uploaded" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Configure your business profile and preferences</p>

        <div className="glass-card rounded-lg p-6 space-y-6">
          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💾 Your changes are being saved automatically. Click "Save Changes" to finalize.
              </p>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={userInfo.first_name} disabled className="bg-gray-100" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={userInfo.last_name} disabled className="bg-gray-100" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={userInfo.email} disabled className="bg-gray-100" />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Business Profile</h2>
            <div className="space-y-4">
              <div>
                <Label>Business Name *</Label>
                <Input value={form.business_name} onChange={(e) => updateForm({ business_name: e.target.value })} placeholder="Your Company Name" />
              </div>
              <div>
                <Label>Business Address</Label>
                <Textarea value={form.business_address} onChange={(e) => updateForm({ business_address: e.target.value })} placeholder="123 Main St, City, Country" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input value={form.business_phone} onChange={(e) => updateForm({ business_phone: e.target.value })} placeholder="+1234567890" />
                  <p className="text-xs text-gray-500 mt-1">Regular phone number for calls</p>
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input value={form.business_whatsapp} onChange={(e) => updateForm({ business_whatsapp: e.target.value })} placeholder="+1234567890" />
                  <p className="text-xs text-gray-500 mt-1">WhatsApp number for messaging</p>
                </div>
              </div>
              <div>
                <Label>Business Motto/Tagline</Label>
                <Input value={form.business_motto} onChange={(e) => updateForm({ business_motto: e.target.value })} placeholder="Your business tagline" />
              </div>
              <div>
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {form.business_logo_url && (
                    <img src={form.business_logo_url} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                  )}
                  <label htmlFor="logo-upload">
                    <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('logo-upload')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Currency & Invoice Settings</h2>
            <div className="space-y-4">
              <div>
                <Label>Default Currency</Label>
                <Select value={form.default_currency} onValueChange={(v) => updateForm({ default_currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Invoice Theme</Label>
                <Select value={form.invoice_theme} onValueChange={(v) => updateForm({ invoice_theme: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default Tax Rate (%)</Label>
                <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => updateForm({ tax_rate: e.target.value })} placeholder="0.00" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!hasChanges}>
            {hasChanges ? "Save Changes" : "No Changes"}
          </Button>
          {hasChanges && (
            <p className="text-xs text-yellow-600 text-center mt-2">⚠️ You have unsaved changes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
