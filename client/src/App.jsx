import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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

// Visitor Tracking
import { initVisitorTracking } from './lib/visitorTracking'

// i18n initialization
import './i18n'

// API Config
import api from './config/api'

// Layouts
import { PublicLayout, DashboardLayout, AdminLayout } from './components/layout'

// UI Components
import { CookieConsent } from './components/ui'

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
import { Pricing, Contact, Blog, BlogPost, Maintenance, Privacy, Terms, Cookies } from './pages/public'

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
  AdminVisitors,
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

// Maintenance Mode Checker Component
function MaintenanceChecker({ children }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  // Initialize visitor tracking on first render
  useEffect(() => {
    initVisitorTracking()
  }, [])

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await api.get('/api/v1/settings/public')
        setIsMaintenanceMode(response.data?.maintenanceMode || false)
      } catch (error) {
        // If error, assume no maintenance
        setIsMaintenanceMode(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkMaintenance()
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000)
    return () => clearInterval(interval)
  }, [])

  // Always allow admin routes
  const isAdminRoute = location.pathname.startsWith('/x-admin')
  
  if (isLoading) {
    return null // Or a loading spinner
  }

  if (isMaintenanceMode && !isAdminRoute) {
    return <Maintenance />
  }

  return children
}

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
                      <MaintenanceChecker>
                        <Routes>
                          {/* Public Routes */}
                          <Route element={<PublicLayout />}>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/cookies" element={<Cookies />} />
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
                      <CookieConsent />
                      </MaintenanceChecker>
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
        <Route path="visitors" element={<AdminVisitors />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}

export default App
