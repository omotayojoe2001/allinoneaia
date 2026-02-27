import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download } from "lucide-react";

export default function CustomReportBuilder() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [fields, setFields] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("30_days");

  const availableFields = {
    sales: ["date", "customer", "amount", "status", "payment_method"],
    expense: ["date", "category", "amount", "vendor", "description"],
    customer: ["name", "email", "total_spent", "last_purchase", "segment"],
    inventory: ["product", "quantity", "unit_price", "total_value", "last_updated"]
  };

  const toggleField = (field: string) => {
    setFields(fields.includes(field) ? fields.filter(f => f !== field) : [...fields, field]);
  };

  const saveReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("custom_reports").insert({
      user_id: user.id,
      name,
      report_type: reportType,
      data_sources: { fields },
      filters: { date_range: dateRange }
    });

    toast({ title: "Success", description: "Report saved" });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Custom Report Builder</h1>

      <Card className="p-6 space-y-4">
        <Input placeholder="Report Name" value={name} onChange={e => setName(e.target.value)} />
        
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Report</SelectItem>
            <SelectItem value="expense">Expense Report</SelectItem>
            <SelectItem value="customer">Customer Report</SelectItem>
            <SelectItem value="inventory">Inventory Report</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <p className="font-medium mb-2">Select Fields</p>
          <div className="grid grid-cols-2 gap-2">
            {availableFields[reportType as keyof typeof availableFields].map(field => (
              <label key={field} className="flex items-center gap-2">
                <Checkbox checked={fields.includes(field)} onCheckedChange={() => toggleField(field)} />
                <span className="text-sm capitalize">{field.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger><SelectValue placeholder="Date Range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7_days">Last 7 Days</SelectItem>
            <SelectItem value="30_days">Last 30 Days</SelectItem>
            <SelectItem value="90_days">Last 90 Days</SelectItem>
            <SelectItem value="1_year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button onClick={saveReport}><Plus className="w-4 h-4 mr-1" />Save Report</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-1" />Export</Button>
        </div>
      </Card>
    </div>
  );
}
