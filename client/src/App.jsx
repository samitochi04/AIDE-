import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'

// Context Providers
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { SimulationProvider } from './context/SimulationContext'

// i18n initialization
import './i18n'

// Layouts
import { PublicLayout, DashboardLayout } from './components/layout'

// Pages
import LandingPage from './pages/landing'
import { 
  Overview as DashboardOverview,
  Aides as DashboardAides,
  Housing as DashboardHousing,
  Procedures as DashboardProcedures,
  Chat as DashboardChat,
  Profile as DashboardProfile,
  Settings as DashboardSettings
} from './pages/dashboard'
import { Login, Register, AuthCallback } from './pages/auth'
import { Simulation, Results as SimulationResults } from './pages/simulation'
import { Pricing, Contact, Blog } from './pages/public'

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
                  <SimulationProvider>
                    <Routes>
                      {/* Public Routes */}
                      <Route element={<PublicLayout />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/blog" element={<Blog />} />
                      </Route>
                      
                      {/* Auth Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      
                      {/* Simulation Routes */}
                      <Route path="/simulation" element={<Simulation />} />
                      <Route path="/simulation/results" element={<SimulationResults />} />
                      
                      {/* Dashboard Routes (Protected) */}
                      <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<DashboardOverview />} />
                        <Route path="aides" element={<DashboardAides />} />
                        <Route path="housing" element={<DashboardHousing />} />
                        <Route path="procedures" element={<DashboardProcedures />} />
                        <Route path="chat" element={<DashboardChat />} />
                        <Route path="profile" element={<DashboardProfile />} />
                        <Route path="settings" element={<DashboardSettings />} />
                      </Route>
                    </Routes>
                  </SimulationProvider>
                </ToastProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
