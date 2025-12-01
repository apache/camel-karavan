/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import {visualizer} from 'rollup-plugin-visualizer';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    plugins: [
        svgr(),
        react(),
        viteTsconfigPaths(),
        visualizer({
            filename: 'stats.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: true
        })
    ],
    server: {
        // this ensures that the browser opens upon server start
        open: false,
        // this sets a default port to 3000, you can change this
        port: 3003,
    },
    build: {
        // sourcemap: true,
        rollupOptions: {
            output: {
                // vite.config.ts (replace only the manualChunks function body)
                manualChunks(id) {
                    // Normalize path for cross-platform matching
                    const n = id.replace(/\\/g, '/');

                    // Helper: extract top-level package name, works with pnpm + npm
                    const m = n.match(/node_modules\/(?:\.pnpm\/)?((?:@[^/]+\/)?[^/@]+)/);
                    const pkg = m?.[1] ?? '';

                    if (n.includes('/node_modules/')) {
                        // --- React family in one chunk ---
                        // if (
                        //     pkg === 'react' ||
                        //     pkg === 'react-dom' ||
                        //     pkg === 'react-is' ||
                        //     pkg === 'scheduler' ||
                        //     pkg === 'history' ||
                        //     pkg.startsWith('react-router')
                        // ) return 'vendor-react';

                        // --- Monaco bucket ---
                        if (pkg.includes('monaco-')) return 'vendor-monaco';

                        // --- PatternFly ---
                        if (pkg.startsWith('@patternfly/')) return 'vendor-patternfly';

                        // --- Known heavy libs (named buckets so you can spot them) ---
                        if (pkg.startsWith('refractor')) return 'vendor-refractor';
                        if (pkg.startsWith('chance')) return 'vendor-chance';
                        if (pkg.startsWith('victory')) return 'vendor-victory';

                        // --- Fallback: group by package to avoid one huge "others" ---
                        return `vendor-other`;
                    }

                    // --- Your app code buckets ---
                    // Keep your special case for the local package:
                    if (n.includes('karavan-core')) return 'karavan-core';
                }
            }
        }
    }
})