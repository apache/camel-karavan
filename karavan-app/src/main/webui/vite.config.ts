import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    plugins: [
        viteTsconfigPaths(),
        svgr(),
        react(),
    ],
    server: {
        open: false,
        port: 3003,
    },
    build: {
        rollupOptions: {}
    },
    // CRITICAL FIX: Placed at the root level!
    // This forces Vite to convert the old CommonJS path-browserify into an ES Module.
    // (Do NOT include the worker.js files here, as Vite handles them natively now)
    optimizeDeps: {
        include: ['path-browserify']
    }
})