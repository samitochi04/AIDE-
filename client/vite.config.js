import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'
import puppeteerRenderer from '@prerenderer/renderer-puppeteer'

// Routes to prerender for SEO
const routesToPrerender = [
  '/',
  '/pricing',
  '/contact',
  '/blog',
  '/privacy',
  '/terms',
  '/cookies',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Prerender static pages for SEO (only in production build)
    process.env.NODE_ENV === 'production' && prerender({
      routes: routesToPrerender,
      renderer: puppeteerRenderer,
      rendererOptions: {
        maxConcurrentRoutes: 4,
        renderAfterDocumentEvent: 'render-event',
        headless: true,
      },
      postProcess(renderedRoute) {
        // Add prerendered attribute for debugging
        renderedRoute.html = renderedRoute.html.replace(
          '</head>',
          '<meta name="prerendered" content="true"></head>'
        )
        return renderedRoute
      },
    }),
  ].filter(Boolean),
  build: {
    // Generate source maps for production debugging (optional)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Security: Don't expose source paths
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
})
