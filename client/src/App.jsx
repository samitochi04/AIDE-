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
import { PublicLayout } from './components/layout'

// Pages
import LandingPage from './pages/landing'

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
                        {/* Add more routes as pages are built */}
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
