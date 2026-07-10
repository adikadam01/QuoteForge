import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SettingsHub from "./pages/Settings/SettingsHub";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import Quotations from "./pages/Quotations";
import QuotationBuilder from "./pages/QuotationBuilder";
import QuotationPreview from "./pages/QuotationPreview";
import QuotationEdit from "./pages/QuotationEdit";
import Analytics from "./pages/Analytics";
import Invoices from "./pages/Invoices";
import InvoiceView from "./pages/InvoiceView";
import PublicQuotation from "@/pages/PublicQuotation";
import PublicInvoice from "@/pages/PublicInvoice";
import ReceiptView from "@/pages/ReceiptView";
import QuotationTemplates from "./pages/QuotationTemplates";
import NotFound from "./pages/NotFound";
import DevTools from "./pages/DevTools";
import Receipts from "./pages/Receipts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            {/* <Route path="/public/quotation/:quotationId" element={<PublicQuotation />} /> */}
            <Route path="/public/invoice/:invoiceId" element={<PublicInvoice />} />
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/services" element={<AppLayout><Services /></AppLayout>} />
            <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
            <Route path="/quotations" element={<AppLayout><Quotations /></AppLayout>} />
            <Route path="/quotations/new" element={<AppLayout><QuotationBuilder /></AppLayout>} />
            <Route path="/quotations/:id/preview" element={<QuotationPreview />} />
            <Route path="/quotations/:id/edit" element={<AppLayout><QuotationEdit /></AppLayout>} />
            <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
            <Route path="/settings/quotation-templates" element={<AppLayout><QuotationTemplates /></AppLayout>} />
            <Route path="/settings/*" element={<AppLayout><SettingsHub /></AppLayout>} />
            <Route path="/invoices" element={<AppLayout><Invoices /></AppLayout>} />
            <Route path="/invoices/:id" element={<AppLayout><InvoiceView /></AppLayout>} />
            <Route path="/public/quotation/:id" element={<PublicQuotation />} />
            <Route path="/receipts" element={<AppLayout><Receipts /></AppLayout>} />
            <Route
              path="/quotations/new/:id"
              element={
                <AppLayout>
                  <QuotationBuilder />
                </AppLayout>
              }
            />
            <Route path="/receipts/:id" element={<AppLayout><ReceiptView /></AppLayout>} />

            {import.meta.env.DEV ? <Route path="/dev" element={<AppLayout><DevTools /></AppLayout>} /> : null}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;