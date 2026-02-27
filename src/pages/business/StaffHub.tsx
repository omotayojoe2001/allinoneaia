import { useState } from "react";
import { ChevronRight } from "lucide-react";
import StaffManagement from "./StaffManagement";
import StaffAttendance from "./StaffAttendance";
import SalaryManagement from "./SalaryManagement";
import PayrollManagement from "./PayrollManagement";

const StaffHub = () => {
  const [active, setActive] = useState("staff");

  const tabs = [
    { id: "staff", label: "Staff", component: StaffManagement },
    { id: "attendance", label: "Attendance", component: StaffAttendance },
    { id: "salary", label: "Salary", component: SalaryManagement },
    { id: "payroll", label: "Payroll", component: PayrollManagement },
  ];

  const ActiveComponent = tabs.find(t => t.id === active)?.component;

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-background px-6 py-2 flex gap-1 border-b">
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

export default StaffHub;
