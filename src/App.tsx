import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import LandingPage from "@/pages/LandingPage";
import SignupPage from "@/pages/SignupPage";
import LoginPage from "@/pages/LoginPage";
import PricingPage from "@/pages/PricingPage";
import SupportPage from "@/pages/SupportPage";
import FundUsPage from "@/pages/FundUsPage";
import Dashboard from "@/pages/Dashboard";
import ChatPage from "@/pages/ChatPage";
import WhatsAppChatbots from "@/pages/WhatsAppChatbots";
import AutomationPage from "@/pages/AutomationPage";
import EmailAutomation from "@/pages/EmailAutomation";
import WhatsAppAutomation from "@/pages/WhatsAppAutomation";
import AIAgentPage from "@/pages/AIAgentPage";
import CustomerServicePage from "@/pages/CustomerServicePage";
import ContentStudioPage from "@/pages/ContentStudioPage";
import SocialMediaPage from "@/pages/SocialMediaPage";
import BusinessToolsPage from "@/pages/BusinessToolsPage";
import RemindersPage from "@/pages/RemindersPage";
import LifeAutomationPage from "@/pages/LifeAutomationPage";
import BillingPage from "@/pages/BillingPage";
import SettingsPage from "@/pages/SettingsPage";
import SalesDashboard from "@/pages/business/SalesDashboard";
import Cashbook from "@/pages/business/Cashbook";
import InvoiceGenerator from "@/pages/business/InvoiceGenerator";
import CustomersPage from "@/pages/business/CustomersPage";
import Bookkeeping from "@/pages/business/Bookkeeping";
import StaffAttendance from "@/pages/business/StaffAttendance";
import SalaryManagement from "@/pages/business/SalaryManagement";
import StockManagement from "@/pages/business/StockManagement";
import Appointments from "@/pages/business/Appointments";
import Tasks from "@/pages/business/Tasks";
import StaffManagement from "@/pages/business/StaffManagement";
import SpreadsheetAI from "@/pages/business/SpreadsheetAI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-background">
    <AppSidebar />
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/fund-us" element={<FundUsPage />} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/ai-agent" element={<AppLayout><AIAgentPage /></AppLayout>} />
              <Route path="/chat" element={<AppLayout><ChatPage /></AppLayout>} />
              <Route path="/chat/:platform" element={<AppLayout><WhatsAppChatbots /></AppLayout>} />
              <Route path="/automation" element={<AppLayout><AutomationPage /></AppLayout>} />
              <Route path="/automation/email" element={<AppLayout><EmailAutomation /></AppLayout>} />
              <Route path="/automation/whatsapp" element={<AppLayout><WhatsAppAutomation /></AppLayout>} />
              <Route path="/customer" element={<AppLayout><CustomerServicePage /></AppLayout>} />
              <Route path="/content" element={<AppLayout><ContentStudioPage /></AppLayout>} />
              <Route path="/social" element={<AppLayout><SocialMediaPage /></AppLayout>} />
              <Route path="/business" element={<AppLayout><BusinessToolsPage /></AppLayout>} />
              <Route path="/business/sales" element={<AppLayout><SalesDashboard /></AppLayout>} />
              <Route path="/business/cashbook" element={<AppLayout><Cashbook /></AppLayout>} />
              <Route path="/business/invoices" element={<AppLayout><InvoiceGenerator /></AppLayout>} />
              <Route path="/business/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
              <Route path="/business/bookkeeping" element={<AppLayout><Bookkeeping /></AppLayout>} />
              <Route path="/business/attendance" element={<AppLayout><StaffAttendance /></AppLayout>} />
              <Route path="/business/salary" element={<AppLayout><SalaryManagement /></AppLayout>} />
              <Route path="/business/stock" element={<AppLayout><StockManagement /></AppLayout>} />
              <Route path="/business/appointments" element={<AppLayout><Appointments /></AppLayout>} />
              <Route path="/business/tasks" element={<AppLayout><Tasks /></AppLayout>} />
              <Route path="/business/staff" element={<AppLayout><StaffManagement /></AppLayout>} />
              <Route path="/business/spreadsheet" element={<AppLayout><SpreadsheetAI /></AppLayout>} />
              <Route path="/reminders" element={<AppLayout><RemindersPage /></AppLayout>} />
              <Route path="/life" element={<AppLayout><LifeAutomationPage /></AppLayout>} />
              <Route path="/billing" element={<AppLayout><BillingPage /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
