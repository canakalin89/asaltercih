import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'yokatlas-dev-proxy',
      configureServer(server) {
        server.middlewares.use('/api/yokatlas', async (req, res, next) => {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 200
            res.end()
            return
          }

          const url = new URL(req.url!, 'http://localhost')
          const targetPath = url.searchParams.get('path')
          if (!targetPath || !targetPath.startsWith('/api/')) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Geçersiz path' }))
            return
          }

          const targetUrl = `https://yokatlas.yok.gov.tr${targetPath}`
          const fetchHeaders: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'tercih-robotu/1.0' }
          if (req.method !== 'GET') {
            fetchHeaders['Content-Type'] = 'application/json'
          }

          const body = req.method !== 'GET'
            ? await new Promise<string>((resolve) => {
                let data = ''
                req.on('data', (chunk) => { data += chunk })
                req.on('end', () => resolve(data))
              })
            : undefined

          try {
            const yokRes = await fetch(targetUrl, {
              method: req.method,
              headers: fetchHeaders,
              body,
            })

            res.setHeader('Access-Control-Allow-Origin', '*')
            const ct = yokRes.headers.get('content-type')
            if (ct) res.setHeader('Content-Type', ct)
            res.statusCode = yokRes.status
            res.end(await yokRes.text())
          } catch (err) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'YÖK Atlas bağlantı hatası' }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
