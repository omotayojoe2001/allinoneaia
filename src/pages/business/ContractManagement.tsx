import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { FileText, Plus, Send, CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ContractManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewContract, setShowNewContract] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    template_type: "custom",
    template_content: ""
  });
  const [newContract, setNewContract] = useState({
    template_id: "",
    contract_title: "",
    party_a_name: "",
    party_a_email: "",
    party_b_name: "",
    party_b_email: "",
    contract_value: "",
    start_date: "",
    end_date: ""
  });
  const [activeView, setActiveView] = useState("contracts");

  const defaultTemplates = {
    nda: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on {{start_date}} between:

Party A: {{party_a_name}}
Party B: {{party_b_name}}

1. CONFIDENTIAL INFORMATION
The parties agree to keep confidential all proprietary information shared during the course of business.

2. OBLIGATIONS
Both parties agree not to disclose confidential information to third parties without prior written consent.

3. TERM
This agreement shall remain in effect until {{end_date}}.

Signed:
_________________          _________________
{{party_a_name}}           {{party_b_name}}`,

    service_agreement: `SERVICE AGREEMENT

This Service Agreement is made on {{start_date}} between:

Service Provider: {{party_a_name}}
Client: {{party_b_name}}

1. SERVICES
The Service Provider agrees to provide the following services as described.

2. COMPENSATION
Total contract value: {{contract_value}}

3. TERM
This agreement is effective from {{start_date}} to {{end_date}}.

4. TERMINATION
Either party may terminate with 30 days written notice.

Signed:
_________________          _________________
{{party_a_name}}           {{party_b_name}}`,

    employment: `EMPLOYMENT CONTRACT

This Employment Contract is entered into on {{start_date}} between:

Employer: {{party_a_name}}
Employee: {{party_b_name}}

1. POSITION
The Employee is hired for the position as agreed.

2. COMPENSATION
Salary: {{contract_value}} per annum

3. START DATE
Employment commences on {{start_date}}.

4. PROBATION
3 months probation period applies.

Signed:
_________________          _________________
{{party_a_name}}           {{party_b_name}}`
  };

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadContracts();
      loadExpiringContracts();
    }
  }, [user]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("contract_templates_library")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true);

    setTemplates(data || []);
  };

  const loadContracts = async () => {
    const { data } = await supabase
      .from("generated_contracts")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    setContracts(data || []);
  };

  const loadExpiringContracts = async () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from("generated_contracts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "signed")
      .lte("expiry_date", thirtyDaysLater.toISOString().split('T')[0])
      .order("expiry_date", { ascending: true });

    setExpiringContracts(data || []);
  };

  const createTemplate = async () => {
    await supabase.from("contract_templates_library").insert({
      user_id: user?.id,
      ...newTemplate
    });

    toast({ title: "Success", description: "Template created" });
    setShowNewTemplate(false);
    loadTemplates();
  };

  const useDefaultTemplate = async (type: string) => {
    await supabase.from("contract_templates_library").insert({
      user_id: user?.id,
      template_name: type.toUpperCase(),
      template_type: type,
      template_content: defaultTemplates[type as keyof typeof defaultTemplates],
      is_default: true
    });

    toast({ title: "Success", description: "Default template added" });
    loadTemplates();
  };

  const generateContract = async () => {
    const template = templates.find(t => t.id === newContract.template_id);
    if (!template) return;

    let content = template.template_content;
    content = content.replace(/{{party_a_name}}/g, newContract.party_a_name);
    content = content.replace(/{{party_b_name}}/g, newContract.party_b_name);
    content = content.replace(/{{contract_value}}/g, newContract.contract_value);
    content = content.replace(/{{start_date}}/g, newContract.start_date);
    content = content.replace(/{{end_date}}/g, newContract.end_date);

    const contractNumber = `CNT-${Date.now()}`;

    await supabase.from("generated_contracts").insert({
      user_id: user?.id,
      contract_number: contractNumber,
      template_id: newContract.template_id,
      contract_type: template.template_type,
      contract_title: newContract.contract_title,
      parties: [
        { name: newContract.party_a_name, email: newContract.party_a_email, role: 'party_a' },
        { name: newContract.party_b_name, email: newContract.party_b_email, role: 'party_b' }
      ],
      contract_content: content,
      contract_value: parseFloat(newContract.contract_value) || 0,
      start_date: newContract.start_date,
      end_date: newContract.end_date,
      expiry_date: newContract.end_date,
      status: 'draft'
    });

    toast({ title: "Success", description: `Contract ${contractNumber} generated` });
    setShowNewContract(false);
    loadContracts();
  };

  const sendForSignature = async (contractId: string) => {
    await supabase
      .from("generated_contracts")
      .update({ status: 'pending_signature' })
      .eq("id", contractId);

    toast({ title: "Success", description: "Contract sent for signature" });
    loadContracts();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Contract Management
            </h1>
            <p className="text-sm text-muted-foreground">Templates, generation & e-signature</p>
          </div>
        </div>

        {expiringContracts.length > 0 && (
          <div className="glass-card rounded-lg p-4 mb-6 bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-foreground">
                <span className="font-bold">{expiringContracts.length}</span> contract(s) expiring in the next 30 days
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-1">
          {[
            { id: "contracts", label: "Contracts" },
            { id: "templates", label: "Templates" },
            { id: "expiring", label: "Expiring Soon" },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 text-sm font-medium rounded transition-all flex items-center gap-1 ${
                activeView === view.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {view.label}
              {activeView === view.id && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {activeView === "contracts" && (
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">All Contracts</h2>
                <Dialog open={showNewContract} onOpenChange={setShowNewContract}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Generate New Contract</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Template</Label>
                        <Select value={newContract.template_id} onValueChange={(v) => setNewContract({ ...newContract, template_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Contract Title</Label>
                        <Input value={newContract.contract_title} onChange={(e) => setNewContract({ ...newContract, contract_title: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Party A Name</Label>
                          <Input value={newContract.party_a_name} onChange={(e) => setNewContract({ ...newContract, party_a_name: e.target.value })} />
                        </div>
                        <div>
                          <Label>Party A Email</Label>
                          <Input type="email" value={newContract.party_a_email} onChange={(e) => setNewContract({ ...newContract, party_a_email: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Party B Name</Label>
                          <Input value={newContract.party_b_name} onChange={(e) => setNewContract({ ...newContract, party_b_name: e.target.value })} />
                        </div>
                        <div>
                          <Label>Party B Email</Label>
                          <Input type="email" value={newContract.party_b_email} onChange={(e) => setNewContract({ ...newContract, party_b_email: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Contract Value</Label>
                          <Input type="number" value={newContract.contract_value} onChange={(e) => setNewContract({ ...newContract, contract_value: e.target.value })} />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input type="date" value={newContract.start_date} onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })} />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input type="date" value={newContract.end_date} onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })} />
                        </div>
                      </div>
                      <Button onClick={generateContract} className="w-full">Generate Contract</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Contract #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Title</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Parties</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Expiry</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{c.contract_number}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{c.contract_title}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {c.parties?.map((p: any) => p.name).join(' & ')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            c.status === 'signed' ? 'bg-green-500/15 text-green-500' :
                            c.status === 'pending_signature' ? 'bg-yellow-500/15 text-yellow-500' :
                            c.status === 'expired' ? 'bg-red-500/15 text-red-500' :
                            'bg-gray-500/15 text-gray-500'
                          }`}>
                            {c.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{c.expiry_date}</td>
                        <td className="py-3 px-4 text-center">
                          {c.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => sendForSignature(c.id)}>
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeView === "templates" && (
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Contract Templates</h2>
                <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Template Name</Label>
                        <Input value={newTemplate.template_name} onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Template Type</Label>
                        <Select value={newTemplate.template_type} onValueChange={(v) => setNewTemplate({ ...newTemplate, template_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="nda">NDA</SelectItem>
                            <SelectItem value="service_agreement">Service Agreement</SelectItem>
                            <SelectItem value="employment">Employment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Template Content</Label>
                        <Textarea
                          value={newTemplate.template_content}
                          onChange={(e) => setNewTemplate({ ...newTemplate, template_content: e.target.value })}
                          rows={10}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use variables: {`{{party_a_name}}, {{party_b_name}}, {{contract_value}}, {{start_date}}, {{end_date}}`}
                        </p>
                      </div>
                      <Button onClick={createTemplate} className="w-full">Create Template</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <Button variant="outline" onClick={() => useDefaultTemplate('nda')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add NDA Template
                </Button>
                <Button variant="outline" onClick={() => useDefaultTemplate('service_agreement')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service Agreement
                </Button>
                <Button variant="outline" onClick={() => useDefaultTemplate('employment')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employment Contract
                </Button>
              </div>

              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{t.template_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{t.template_type.replace('_', ' ')}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {t.is_default ? 'DEFAULT' : 'CUSTOM'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}

        {activeView === "expiring" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Contracts Expiring Soon</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Contract #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Title</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Expiry Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringContracts.map((c) => {
                      const daysLeft = Math.floor((new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={c.id} className="border-b border-border">
                          <td className="py-3 px-4 text-sm text-foreground">{c.contract_number}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{c.contract_title}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{c.expiry_date}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`${daysLeft <= 7 ? 'text-red-500' : 'text-orange-500'} font-medium`}>
                              {daysLeft} days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagement;
