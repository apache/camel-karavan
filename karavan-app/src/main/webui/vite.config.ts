import {defineConfig} from 'vite'
import {fileURLToPath} from 'node:url'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
    base: '/',
    plugins: [
        svgr(),
        react(),
        yaml()
    ],
    server: {
        open: false,
        port: 3003,
    },
    build: {
        rolldownOptions: {},
    },
    optimizeDeps: {
        include: ['path-browserify']
    },
    resolve: {
        tsconfigPaths: true,
        alias: [
            {
                find: /^monaco-editor\/esm\/vs\/editor\/editor\.worker(\.js)?$/,
                replacement: 'monaco-editor/editor/editor.worker.js',
            },
            {
                find: /^monaco-worker-manager$/,
                replacement: fileURLToPath(
                    new URL('./src/ui/shared/monaco-worker-manager-compat.ts', import.meta.url)),
            },
        ],
    }
})
