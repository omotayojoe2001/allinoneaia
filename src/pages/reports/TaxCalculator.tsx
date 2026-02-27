import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Calculator, Download, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TaxCalculator = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // VAT
  const [vatAmount, setVatAmount] = useState("");
  const [vatResult, setVatResult] = useState({ vat: 0, total: 0 });
  
  // WHT
  const [whtAmount, setWhtAmount] = useState("");
  const [whtCategory, setWhtCategory] = useState("services");
  const [whtResult, setWhtResult] = useState({ wht: 0, net: 0, rate: 5 });
  
  // PAYE
  const [grossSalary, setGrossSalary] = useState("");
  const [payeResult, setPayeResult] = useState({ taxable: 0, paye: 0, net: 0, relief: 0 });
  
  // Pension
  const [basicSalary, setBasicSalary] = useState("");
  const [pensionResult, setPensionResult] = useState({ employee: 0, employer: 0, total: 0 });
  
  // Monthly liability
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [remittanceSchedule, setRemittanceSchedule] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user && startDate && endDate) {
      loadTaxData();
    }
  }, [user, startDate, endDate]);

  const loadTaxData = async () => {
    const { data } = await supabase
      .from("tax_calculations")
      .select("*")
      .eq("user_id", user?.id)
      .gte("period_start", startDate)
      .lte("period_end", endDate)
      .order("period_start", { ascending: false });

    if (data) {
      // Group by month
      const monthly: any = {};
      data.forEach(t => {
        const month = t.period_start.substring(0, 7);
        if (!monthly[month]) monthly[month] = { vat: 0, wht: 0, paye: 0, pension: 0 };
        monthly[month][t.calculation_type] += parseFloat(t.tax_amount);
      });
      const monthlyArray = Object.keys(monthly).map(month => ({
        month,
        ...monthly[month],
        total: monthly[month].vat + monthly[month].wht + monthly[month].paye + monthly[month].pension
      }));
      setMonthlyData(monthlyArray);

      // Remittance schedule (pending/overdue)
      const schedule = data.filter(t => t.status !== 'paid').map(t => ({
        type: t.calculation_type.toUpperCase(),
        amount: parseFloat(t.tax_amount),
        dueDate: t.due_date,
        status: t.status
      }));
      setRemittanceSchedule(schedule);
    }
  };

  const calculateVAT = () => {
    const amount = parseFloat(vatAmount) || 0;
    const vat = amount * 0.075;
    const total = amount + vat;
    setVatResult({ vat, total });
  };

  const calculateWHT = () => {
    const amount = parseFloat(whtAmount) || 0;
    const rates: any = { services: 5, rent: 10, dividends: 10, interest: 10, royalties: 10, consultancy: 5 };
    const rate = rates[whtCategory] || 5;
    const wht = amount * (rate / 100);
    const net = amount - wht;
    setWhtResult({ wht, net, rate });
  };

  const calculatePAYE = () => {
    const gross = parseFloat(grossSalary) || 0;
    const relief = 200000 + (gross * 0.2); // Consolidated relief
    const taxable = Math.max(0, gross - relief);
    
    // PAYE tax bands (annual)
    let paye = 0;
    if (taxable <= 300000) paye = taxable * 0.07;
    else if (taxable <= 600000) paye = 21000 + (taxable - 300000) * 0.11;
    else if (taxable <= 1100000) paye = 54000 + (taxable - 600000) * 0.15;
    else if (taxable <= 1600000) paye = 129000 + (taxable - 1100000) * 0.19;
    else if (taxable <= 3200000) paye = 224000 + (taxable - 1600000) * 0.21;
    else paye = 560000 + (taxable - 3200000) * 0.24;
    
    const net = gross - paye;
    setPayeResult({ taxable, paye, net, relief });
  };

  const calculatePension = () => {
    const basic = parseFloat(basicSalary) || 0;
    const employee = basic * 0.08;
    const employer = basic * 0.10;
    const total = employee + employer;
    setPensionResult({ employee, employer, total });
  };

  const saveTaxCalculation = async (type: string, baseAmount: number, taxRate: number, taxAmount: number) => {
    await supabase.from("tax_calculations").insert({
      user_id: user?.id,
      calculation_type: type,
      period_start: startDate,
      period_end: endDate,
      base_amount: baseAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      net_amount: baseAmount - taxAmount,
      due_date: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 21)).toISOString().split('T')[0]
    });
    toast({ title: "Success", description: `${type.toUpperCase()} calculation saved` });
    loadTaxData();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Nigerian Tax Summary Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

    // Monthly liability
    autoTable(doc, {
      startY: 40,
      head: [["Month", "VAT", "WHT", "PAYE", "Pension", "Total"]],
      body: monthlyData.map(m => [
        m.month,
        formatAmount(m.vat),
        formatAmount(m.wht),
        formatAmount(m.paye),
        formatAmount(m.pension),
        formatAmount(m.total)
      ])
    });

    // Remittance schedule
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Type", "Amount", "Due Date", "Status"]],
      body: remittanceSchedule.map(r => [r.type, formatAmount(r.amount), r.dueDate, r.status.toUpperCase()])
    });

    doc.save("nigerian-tax-report.pdf");
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Nigerian Tax Calculator
            </h1>
            <p className="text-sm text-muted-foreground">VAT, WHT, PAYE & Pension calculations</p>
          </div>
          <Button onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <Tabs defaultValue="calculators" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculators">Calculators</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Liability</TabsTrigger>
            <TabsTrigger value="remittance">Remittance Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="calculators">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VAT Calculator */}
              <div className="glass-card rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">VAT Calculator (7.5%)</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Amount (excluding VAT)</Label>
                    <Input type="number" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <Button onClick={calculateVAT} className="w-full">Calculate VAT</Button>
                  {vatResult.vat > 0 && (
                    <div className="bg-secondary rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT (7.5%):</span>
                        <span className="font-medium text-foreground">{formatAmount(vatResult.vat)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Total (incl. VAT):</span>
                        <span className="text-primary">{formatAmount(vatResult.total)}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => saveTaxCalculation('vat', parseFloat(vatAmount), 7.5, vatResult.vat)} className="w-full mt-2">
                        Save Calculation
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* WHT Calculator */}
              <div className="glass-card rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">WHT Calculator</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Gross Amount</Label>
                    <Input type="number" value={whtAmount} onChange={(e) => setWhtAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={whtCategory} onValueChange={setWhtCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="services">Services (5%)</SelectItem>
                        <SelectItem value="consultancy">Consultancy (5%)</SelectItem>
                        <SelectItem value="rent">Rent (10%)</SelectItem>
                        <SelectItem value="dividends">Dividends (10%)</SelectItem>
                        <SelectItem value="interest">Interest (10%)</SelectItem>
                        <SelectItem value="royalties">Royalties (10%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={calculateWHT} className="w-full">Calculate WHT</Button>
                  {whtResult.wht > 0 && (
                    <div className="bg-secondary rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">WHT ({whtResult.rate}%):</span>
                        <span className="font-medium text-red-500">{formatAmount(whtResult.wht)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Net Amount:</span>
                        <span className="text-primary">{formatAmount(whtResult.net)}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => saveTaxCalculation('wht', parseFloat(whtAmount), whtResult.rate, whtResult.wht)} className="w-full mt-2">
                        Save Calculation
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYE Calculator */}
              <div className="glass-card rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">PAYE Calculator</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Annual Gross Salary</Label>
                    <Input type="number" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} placeholder="0.00" />
                  </div>
                  <Button onClick={calculatePAYE} className="w-full">Calculate PAYE</Button>
                  {payeResult.paye > 0 && (
                    <div className="bg-secondary rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Relief:</span>
                        <span className="font-medium text-green-500">{formatAmount(payeResult.relief)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxable Income:</span>
                        <span className="font-medium text-foreground">{formatAmount(payeResult.taxable)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">PAYE Tax:</span>
                        <span className="font-medium text-red-500">{formatAmount(payeResult.paye)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Net Salary:</span>
                        <span className="text-primary">{formatAmount(payeResult.net)}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => saveTaxCalculation('paye', parseFloat(grossSalary), 0, payeResult.paye)} className="w-full mt-2">
                        Save Calculation
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pension Calculator */}
              <div className="glass-card rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Pension Calculator</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Monthly Basic Salary</Label>
                    <Input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="0.00" />
                  </div>
                  <Button onClick={calculatePension} className="w-full">Calculate Pension</Button>
                  {pensionResult.total > 0 && (
                    <div className="bg-secondary rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Employee (8%):</span>
                        <span className="font-medium text-foreground">{formatAmount(pensionResult.employee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Employer (10%):</span>
                        <span className="font-medium text-foreground">{formatAmount(pensionResult.employer)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Total Contribution:</span>
                        <span className="text-primary">{formatAmount(pensionResult.total)}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => saveTaxCalculation('pension', parseFloat(basicSalary), 18, pensionResult.total)} className="w-full mt-2">
                        Save Calculation
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Monthly Tax Liability</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Month</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">VAT</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">WHT</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">PAYE</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Pension</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{m.month}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(m.vat)}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(m.wht)}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(m.paye)}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(m.pension)}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-primary">{formatAmount(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="remittance">
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Tax Remittance Schedule</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Amount</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Due Date</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remittanceSchedule.map((r, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{r.type}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(r.amount)}</td>
                        <td className="py-3 px-4 text-sm text-center text-foreground">{r.dueDate}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            r.status === 'overdue' ? 'bg-red-500/15 text-red-500' : 'bg-yellow-500/15 text-yellow-500'
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TaxCalculator;
