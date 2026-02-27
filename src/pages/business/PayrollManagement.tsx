import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DollarSign, FileText, Calendar, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PayrollManagement = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [remittances, setRemittances] = useState<any[]>([]);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [activeView, setActiveView] = useState("runs");

  useEffect(() => {
    if (user) {
      loadPayrollRuns();
      loadRemittances();
    }
  }, [user]);

  const loadPayrollRuns = async () => {
    const { data } = await supabase
      .from("payroll_runs_history")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    setPayrollRuns(data || []);
  };

  const loadRemittances = async () => {
    const { data } = await supabase
      .from("tax_remittance_schedule")
      .select("*")
      .eq("user_id", user?.id)
      .order("due_date", { ascending: true });

    setRemittances(data || []);
  };

  const calculatePAYE = (grossAnnual: number) => {
    const relief = 200000 + (grossAnnual * 0.2);
    const taxable = Math.max(0, grossAnnual - relief);
    
    let paye = 0;
    if (taxable <= 300000) paye = taxable * 0.07;
    else if (taxable <= 600000) paye = 21000 + (taxable - 300000) * 0.11;
    else if (taxable <= 1100000) paye = 54000 + (taxable - 600000) * 0.15;
    else if (taxable <= 1600000) paye = 129000 + (taxable - 1100000) * 0.19;
    else if (taxable <= 3200000) paye = 224000 + (taxable - 1600000) * 0.21;
    else paye = 560000 + (taxable - 3200000) * 0.24;
    
    return { relief, taxable, paye: paye / 12 }; // Monthly PAYE
  };

  const runPayroll = async () => {
    const { data: staff } = await supabase
      .from("staff_list")
      .select("*")
      .eq("user_id", user?.id);

    if (!staff || staff.length === 0) {
      toast({ title: "Error", description: "No staff found", variant: "destructive" });
      return;
    }

    const runNumber = `PR-${currentYear}${String(currentMonth).padStart(2, '0')}-${Date.now()}`;
    let totalGross = 0;
    let totalPAYE = 0;
    let totalPensionEmp = 0;
    let totalPensionEmpr = 0;
    let totalNet = 0;

    const payslipsData = [];

    for (const employee of staff) {
      const basic = parseFloat(employee.salary) || 0;
      const housing = basic * 0.3; // 30% housing
      const transport = basic * 0.2; // 20% transport
      const gross = basic + housing + transport;
      const grossAnnual = gross * 12;

      const { relief, taxable, paye } = calculatePAYE(grossAnnual);
      const pensionEmp = (basic + housing + transport) * 0.08;
      const pensionEmpr = (basic + housing + transport) * 0.10;
      const totalDeductions = paye + pensionEmp;
      const net = gross - totalDeductions;

      totalGross += gross;
      totalPAYE += paye;
      totalPensionEmp += pensionEmp;
      totalPensionEmpr += pensionEmpr;
      totalNet += net;

      payslipsData.push({
        user_id: user?.id,
        staff_id: employee.id,
        staff_name: employee.name,
        staff_email: employee.email,
        period_month: currentMonth,
        period_year: currentYear,
        basic_salary: basic,
        housing_allowance: housing,
        transport_allowance: transport,
        gross_salary: gross,
        consolidated_relief: relief / 12,
        taxable_income: taxable / 12,
        paye_tax: paye,
        pension_employee: pensionEmp,
        pension_employer: pensionEmpr,
        total_deductions: totalDeductions,
        net_salary: net
      });
    }

    // Create payroll run
    const { data: run } = await supabase
      .from("payroll_runs_history")
      .insert({
        user_id: user?.id,
        run_number: runNumber,
        period_month: currentMonth,
        period_year: currentYear,
        total_gross: totalGross,
        total_paye: totalPAYE,
        total_pension_employee: totalPensionEmp,
        total_pension_employer: totalPensionEmpr,
        total_net: totalNet,
        staff_count: staff.length,
        status: 'draft'
      })
      .select()
      .single();

    if (run) {
      // Create payslips
      const payslipsWithRunId = payslipsData.map(p => ({ ...p, payroll_run_id: run.id }));
      await supabase.from("generated_payslips").insert(payslipsWithRunId);

      // Create remittance schedule
      const nextMonth = new Date(currentYear, currentMonth, 10); // 10th of next month
      await supabase.from("tax_remittance_schedule").insert([
        {
          user_id: user?.id,
          remittance_type: 'paye',
          period_month: currentMonth,
          period_year: currentYear,
          amount: totalPAYE,
          due_date: nextMonth.toISOString().split('T')[0]
        },
        {
          user_id: user?.id,
          remittance_type: 'pension',
          period_month: currentMonth,
          period_year: currentYear,
          amount: totalPensionEmp + totalPensionEmpr,
          due_date: nextMonth.toISOString().split('T')[0]
        }
      ]);

      toast({ title: "Success", description: `Payroll ${runNumber} generated for ${staff.length} staff` });
      loadPayrollRuns();
      loadRemittances();
    }
  };

  const approvePayroll = async (runId: string) => {
    await supabase
      .from("payroll_runs_history")
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq("id", runId);

    toast({ title: "Success", description: "Payroll approved" });
    loadPayrollRuns();
  };

  const viewPayslips = async (runId: string) => {
    const { data } = await supabase
      .from("generated_payslips")
      .select("*")
      .eq("payroll_run_id", runId);

    setPayslips(data || []);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Payroll Management
            </h1>
            <p className="text-sm text-muted-foreground">Nigerian PAYE, Pension & Payslips</p>
          </div>
          <Button onClick={runPayroll}>
            <Calendar className="w-4 h-4 mr-2" />
            Run Payroll
          </Button>
        </div>

        <div className="mb-4 flex gap-1">
          {[
            { id: "runs", label: "Payroll Runs" },
            { id: "payslips", label: "Payslips" },
            { id: "remittances", label: "Remittances" },
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

        {activeView === "runs" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Payroll History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Run #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Period</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Staff</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Gross</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">PAYE</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Net</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRuns.map((run) => (
                      <tr key={run.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{run.run_number}</td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {String(run.period_month).padStart(2, '0')}/{run.period_year}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{run.staff_count}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(run.total_gross)}</td>
                        <td className="py-3 px-4 text-sm text-right text-red-500">{formatAmount(run.total_paye)}</td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-primary">{formatAmount(run.total_net)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            run.status === 'paid' ? 'bg-green-500/15 text-green-500' :
                            run.status === 'approved' ? 'bg-blue-500/15 text-blue-500' :
                            'bg-gray-500/15 text-gray-500'
                          }`}>
                            {run.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center space-x-2">
                          {run.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => approvePayroll(run.id)}>
                              Approve
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => viewPayslips(run.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeView === "payslips" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Generated Payslips</h2>
              {payslips.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Staff</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Basic</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Gross</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">PAYE</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Pension</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Net</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map((slip) => (
                        <tr key={slip.id} className="border-b border-border">
                          <td className="py-3 px-4 text-sm text-foreground">{slip.staff_name}</td>
                          <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(slip.basic_salary)}</td>
                          <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(slip.gross_salary)}</td>
                          <td className="py-3 px-4 text-sm text-right text-red-500">{formatAmount(slip.paye_tax)}</td>
                          <td className="py-3 px-4 text-sm text-right text-orange-500">{formatAmount(slip.pension_employee)}</td>
                          <td className="py-3 px-4 text-sm text-right font-bold text-primary">{formatAmount(slip.net_salary)}</td>
                          <td className="py-3 px-4 text-center">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a payroll run to view payslips</p>
                </div>
              )}
            </div>
        )}

        {activeView === "remittances" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Tax & Pension Remittances</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Period</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Due Date</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remittances.map((rem) => (
                      <tr key={rem.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground uppercase">{rem.remittance_type}</td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {String(rem.period_month).padStart(2, '0')}/{rem.period_year}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-foreground">{formatAmount(rem.amount)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{rem.due_date}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rem.status === 'paid' ? 'bg-green-500/15 text-green-500' :
                            rem.status === 'overdue' ? 'bg-red-500/15 text-red-500' :
                            'bg-yellow-500/15 text-yellow-500'
                          }`}>
                            {rem.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PayrollManagement;
