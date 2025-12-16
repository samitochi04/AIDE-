import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'

// Context Providers
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { SimulationProvider } from './context/SimulationContext'
import { NotificationProvider } from './context/NotificationContext'
import { AdminProvider } from './context/AdminContext'

// i18n initialization
import './i18n'

// Layouts
import { PublicLayout, DashboardLayout, AdminLayout } from './components/layout'

// Pages
import LandingPage from './pages/landing'
import { 
  Overview as DashboardOverview,
  Aides as DashboardAides,
  Housing as DashboardHousing,
  Procedures as DashboardProcedures,
  Tutorials as DashboardTutorials,
  TutorialView as DashboardTutorialView,
  Chat as DashboardChat,
  Profile as DashboardProfile,
  Settings as DashboardSettings,
  Affiliate as DashboardAffiliate
} from './pages/dashboard'
import { Login, Register, AuthCallback, CheckoutSuccess, CheckoutCancel } from './pages/auth'
import { Simulation, Results as SimulationResults } from './pages/simulation'
import { Pricing, Contact, Blog, BlogPost } from './pages/public'

// Admin Pages
import {
  AdminLogin,
  AdminDashboard,
  AdminUsers,
  AdminUserDetail,
  AdminAffiliates,
  AdminGovAides,
  AdminProcedures,
  AdminRenting,
  AdminContent,
  AdminEmails,
  AdminAnalytics,
  AdminSettings,
  AdminAdmins
} from './pages/admin'

// Styles
import './styles/index.css'

// Create a QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// App Component
function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <SimulationProvider>
                      <Routes>
                        {/* Public Routes */}
                        <Route element={<PublicLayout />}>
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/pricing" element={<Pricing />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/blog" element={<Blog />} />
                          <Route path="/blog/:slug" element={<BlogPost />} />
                        </Route>
                        
                        {/* Auth Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/checkout/success" element={<CheckoutSuccess />} />
                        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                        
                        {/* Simulation Routes */}
                        <Route path="/simulation" element={<Simulation />} />
                        <Route path="/simulation/results" element={<SimulationResults />} />
                        
                        {/* Dashboard Routes (Protected) */}
                        <Route path="/dashboard" element={<DashboardLayout />}>
                          <Route index element={<DashboardOverview />} />
                          <Route path="aides" element={<DashboardAides />} />
                          <Route path="housing" element={<DashboardHousing />} />
                          <Route path="procedures" element={<DashboardProcedures />} />
                          <Route path="tutorials" element={<DashboardTutorials />} />
                          <Route path="tutorials/:slug" element={<DashboardTutorialView />} />
                          <Route path="chat" element={<DashboardChat />} />
                          <Route path="affiliate" element={<DashboardAffiliate />} />
                          <Route path="profile" element={<DashboardProfile />} />
                          <Route path="settings" element={<DashboardSettings />} />
                        </Route>

                        {/* Admin Routes (single AdminProvider wrapper) */}
                        <Route path="/x-admin/*" element={<AdminProvider><AdminRoutes /></AdminProvider>} />
                      </Routes>
                    </SimulationProvider>
                  </NotificationProvider>
                </ToastProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

// Separate Admin Routes component to keep routes inside single AdminProvider
function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="affiliates" element={<AdminAffiliates />} />
        <Route path="gov-aides" element={<AdminGovAides />} />
        <Route path="procedures" element={<AdminProcedures />} />
        <Route path="renting" element={<AdminRenting />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="emails" element={<AdminEmails />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}

export default App
