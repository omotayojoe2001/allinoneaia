import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import AppSidebar from "@/components/AppSidebar";
import LandingPage from "@/pages/LandingPage";
import SignupPage from "@/pages/SignupPage";
import LoginPage from "@/pages/LoginPage";
import PricingPage from "@/pages/PricingPage";
import SupportPage from "@/pages/SupportPage";
import FundUsPage from "@/pages/FundUsPage";
import DashboardTest from "@/pages/DashboardTest";
import Dashboard from "@/pages/Dashboard";
import ChatPage from "@/pages/ChatPage";
import WhatsAppChatbots from "@/pages/WhatsAppChatbots";
import AutomationPage from "@/pages/AutomationPage";
import EmailAutomation from "@/pages/EmailAutomation";
import WhatsAppAutomation from "@/pages/WhatsAppAutomation";
import WhatsAppTest from "@/pages/WhatsAppTest";
import AIAgentPage from "@/pages/AIAgentPage";
import CustomerServicePage from "@/pages/CustomerServicePage";
import ContentStudioPage from "@/pages/ContentStudioPage";
import SocialMediaPage from "@/pages/SocialMediaPage";
import SocialManagerPage from "@/pages/SocialManagerPage";
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
import PaymentSettings from "@/pages/business/PaymentSettings";
import InvoiceReminders from "@/pages/business/InvoiceReminders";
import CustomerIntelligence from "@/pages/business/CustomerIntelligence";
import InventoryIntelligence from "@/pages/business/InventoryIntelligence";
import ContractManagement from "@/pages/business/ContractManagement";
import PayrollManagement from "@/pages/business/PayrollManagement";
import SpreadsheetAI from "@/pages/business/SpreadsheetAI";
import GrowthServices from "@/pages/social/GrowthServices";
import SocialScheduler from "@/pages/social/SocialScheduler";
import GrammarChecker from "@/pages/content/GrammarChecker";
import AIWriter from "@/pages/content/AIWriter";
import VoiceOverAI from "@/pages/content/VoiceOverAI";
import VoiceoverLibrary from "@/pages/content/VoiceoverLibrary";
import DocumentEditor from "@/pages/content/DocumentEditor";
import PresentationAI from "@/pages/content/PresentationAI";
import SEOOptimizer from "@/pages/content/SEOOptimizer";
import ProfitLoss from "@/pages/reports/ProfitLoss";
import TaxCalculator from "@/pages/reports/TaxCalculator";
import SpendingPatterns from "@/pages/reports/SpendingPatterns";
import CashFlowForecast from "@/pages/reports/CashFlowForecast";
import AIAnalyticsDashboard from "@/pages/reports/AIAnalyticsDashboard";
import ProposalBuilder from "@/pages/business/ProposalBuilder";
import EmailAnalytics from "@/pages/marketing/EmailAnalytics";
import EmailSequences from "@/pages/marketing/EmailSequences";
import UnsubscribeManagement from "@/pages/marketing/UnsubscribeManagement";
import EmailDeliverability from "@/pages/marketing/EmailDeliverability";
import BulkEmailSender from "@/pages/marketing/BulkEmailSender";
import CRMEmailTriggers from "@/pages/marketing/CRMEmailTriggers";
import ExecutiveDashboard from "@/pages/reports/ExecutiveDashboard";
import CustomReportBuilder from "@/pages/reports/CustomReportBuilder";
import BudgetVsActual from "@/pages/reports/BudgetVsActual";
import FinancialHealthScore from "@/pages/reports/FinancialHealthScore";
import SubscriptionManagement from "@/pages/settings/SubscriptionManagement";
import HelpCenter from "@/pages/settings/HelpCenter";
import NotificationsCenter from "@/pages/settings/NotificationsCenter";
import FinanceHub from "@/pages/business/FinanceHub";
import CustomersHub from "@/pages/business/CustomersHub";
import InventoryHub from "@/pages/business/InventoryHub";
import StaffHub from "@/pages/business/StaffHub";
import FinancialReportsHub from "@/pages/reports/FinancialReportsHub";
import AIAnalyticsHub from "@/pages/reports/AIAnalyticsHub";
import ContentHub from "@/pages/content/ContentHub";
import SocialMediaHub from "@/pages/social/SocialMediaHub";
import EmailMarketingHub from "@/pages/marketing/EmailMarketingHub";
import InvoicePaymentPage from "@/pages/InvoicePaymentPage";
import { ReminderScheduler } from "@/components/ReminderScheduler";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-background">
    <AppSidebar />
    <div className="ml-[240px] flex-1">
      {children}
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <ReminderScheduler />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/fund-us" element={<FundUsPage />} />
              <Route path="/pay/:invoiceId" element={<InvoicePaymentPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/dashboard-test" element={<ProtectedRoute><AppLayout><DashboardTest /></AppLayout></ProtectedRoute>} />
              <Route path="/ai-agent" element={<ProtectedRoute><AppLayout><AIAgentPage /></AppLayout></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
              <Route path="/chat/:platform" element={<ProtectedRoute><AppLayout><WhatsAppChatbots /></AppLayout></ProtectedRoute>} />
              <Route path="/automation" element={<ProtectedRoute><AppLayout><AutomationPage /></AppLayout></ProtectedRoute>} />
              <Route path="/automation/email" element={<ProtectedRoute><AppLayout><EmailAutomation /></AppLayout></ProtectedRoute>} />
              <Route path="/automation/whatsapp" element={<ProtectedRoute><AppLayout><WhatsAppAutomation /></AppLayout></ProtectedRoute>} />
              <Route path="/automation/whatsapp-test" element={<ProtectedRoute><AppLayout><WhatsAppTest /></AppLayout></ProtectedRoute>} />
              <Route path="/customer" element={<ProtectedRoute><AppLayout><CustomerServicePage /></AppLayout></ProtectedRoute>} />
              <Route path="/content/hub" element={<ProtectedRoute><AppLayout><ContentHub /></AppLayout></ProtectedRoute>} />
              <Route path="/content" element={<ProtectedRoute><AppLayout><ContentStudioPage /></AppLayout></ProtectedRoute>} />
              <Route path="/content/grammar" element={<ProtectedRoute><AppLayout><GrammarChecker /></AppLayout></ProtectedRoute>} />
              <Route path="/content/writer" element={<ProtectedRoute><AppLayout><AIWriter /></AppLayout></ProtectedRoute>} />
              <Route path="/content/editor" element={<ProtectedRoute><AppLayout><DocumentEditor /></AppLayout></ProtectedRoute>} />
              <Route path="/content/presentation" element={<ProtectedRoute><AppLayout><PresentationAI /></AppLayout></ProtectedRoute>} />
              <Route path="/content/seo" element={<ProtectedRoute><AppLayout><SEOOptimizer /></AppLayout></ProtectedRoute>} />
              <Route path="/content/voiceover" element={<ProtectedRoute><AppLayout><VoiceOverAI /></AppLayout></ProtectedRoute>} />
              <Route path="/content/voiceover/library" element={<ProtectedRoute><AppLayout><VoiceoverLibrary /></AppLayout></ProtectedRoute>} />
              <Route path="/social/hub" element={<ProtectedRoute><AppLayout><SocialMediaHub /></AppLayout></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><AppLayout><SocialMediaPage /></AppLayout></ProtectedRoute>} />
              <Route path="/social-manager" element={<ProtectedRoute><AppLayout><SocialManagerPage /></AppLayout></ProtectedRoute>} />
              <Route path="/social/growth" element={<ProtectedRoute><AppLayout><GrowthServices /></AppLayout></ProtectedRoute>} />
              <Route path="/social/scheduler" element={<ProtectedRoute><AppLayout><SocialScheduler /></AppLayout></ProtectedRoute>} />
              <Route path="/business" element={<ProtectedRoute><AppLayout><BusinessToolsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/business/finance" element={<ProtectedRoute><AppLayout><FinanceHub /></AppLayout></ProtectedRoute>} />
              <Route path="/business/customers-hub" element={<ProtectedRoute><AppLayout><CustomersHub /></AppLayout></ProtectedRoute>} />
              <Route path="/business/inventory-hub" element={<ProtectedRoute><AppLayout><InventoryHub /></AppLayout></ProtectedRoute>} />
              <Route path="/business/staff-hub" element={<ProtectedRoute><AppLayout><StaffHub /></AppLayout></ProtectedRoute>} />
              <Route path="/business/sales" element={<ProtectedRoute><AppLayout><SalesDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/business/cashbook" element={<ProtectedRoute><AppLayout><Cashbook /></AppLayout></ProtectedRoute>} />
              <Route path="/business/invoices" element={<ProtectedRoute><AppLayout><InvoiceGenerator /></AppLayout></ProtectedRoute>} />
              <Route path="/business/customers" element={<ProtectedRoute><AppLayout><CustomersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/business/bookkeeping" element={<ProtectedRoute><AppLayout><Bookkeeping /></AppLayout></ProtectedRoute>} />
              <Route path="/business/attendance" element={<ProtectedRoute><AppLayout><StaffAttendance /></AppLayout></ProtectedRoute>} />
              <Route path="/business/salary" element={<ProtectedRoute><AppLayout><SalaryManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/business/stock" element={<ProtectedRoute><AppLayout><StockManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/business/appointments" element={<ProtectedRoute><AppLayout><Appointments /></AppLayout></ProtectedRoute>} />
              <Route path="/business/tasks" element={<ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>} />
              <Route path="/business/staff" element={<ProtectedRoute><AppLayout><StaffManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/business/payment-settings" element={<ProtectedRoute><AppLayout><PaymentSettings /></AppLayout></ProtectedRoute>} />
              <Route path="/business/invoice-reminders" element={<ProtectedRoute><AppLayout><InvoiceReminders /></AppLayout></ProtectedRoute>} />
              <Route path="/business/customer-intelligence" element={<ProtectedRoute><AppLayout><CustomerIntelligence /></AppLayout></ProtectedRoute>} />
              <Route path="/business/inventory-intelligence" element={<ProtectedRoute><AppLayout><InventoryIntelligence /></AppLayout></ProtectedRoute>} />
              <Route path="/business/contracts" element={<ProtectedRoute><AppLayout><ContractManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/business/payroll" element={<ProtectedRoute><AppLayout><PayrollManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/business/reports" element={<ProtectedRoute><AppLayout><SpreadsheetAI /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/financial-hub" element={<ProtectedRoute><AppLayout><FinancialReportsHub /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/ai-analytics-hub" element={<ProtectedRoute><AppLayout><AIAnalyticsHub /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/profit-loss" element={<ProtectedRoute><AppLayout><ProfitLoss /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/tax-calculator" element={<ProtectedRoute><AppLayout><TaxCalculator /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/spending-patterns" element={<ProtectedRoute><AppLayout><SpendingPatterns /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/cash-flow" element={<ProtectedRoute><AppLayout><CashFlowForecast /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/ai-analytics" element={<ProtectedRoute><AppLayout><AIAnalyticsDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/business/proposals" element={<ProtectedRoute><AppLayout><ProposalBuilder /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/email-hub" element={<ProtectedRoute><AppLayout><EmailMarketingHub /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/email-analytics" element={<ProtectedRoute><AppLayout><EmailAnalytics /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/email-sequences" element={<ProtectedRoute><AppLayout><EmailSequences /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/unsubscribe" element={<ProtectedRoute><AppLayout><UnsubscribeManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/deliverability" element={<ProtectedRoute><AppLayout><EmailDeliverability /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/bulk-sender" element={<ProtectedRoute><AppLayout><BulkEmailSender /></AppLayout></ProtectedRoute>} />
              <Route path="/marketing/crm-triggers" element={<ProtectedRoute><AppLayout><CRMEmailTriggers /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/executive" element={<ProtectedRoute><AppLayout><ExecutiveDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/custom-builder" element={<ProtectedRoute><AppLayout><CustomReportBuilder /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/budget-vs-actual" element={<ProtectedRoute><AppLayout><BudgetVsActual /></AppLayout></ProtectedRoute>} />
              <Route path="/reports/financial-health" element={<ProtectedRoute><AppLayout><FinancialHealthScore /></AppLayout></ProtectedRoute>} />
              <Route path="/settings/subscription" element={<ProtectedRoute><AppLayout><SubscriptionManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/settings/help" element={<ProtectedRoute><AppLayout><HelpCenter /></AppLayout></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><AppLayout><NotificationsCenter /></AppLayout></ProtectedRoute>} />
              <Route path="/reminders" element={<ProtectedRoute><AppLayout><RemindersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/life" element={<ProtectedRoute><AppLayout><LifeAutomationPage /></AppLayout></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><AppLayout><BillingPage /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
