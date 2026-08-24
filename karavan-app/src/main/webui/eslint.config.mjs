// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended, // <-- ADD THIS: Sets up the TS parser and recommended rules
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: ['src/core/**'],                       // generated
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', {
                args: 'none'
            }],
            'no-restricted-imports': ['error', {
                paths: [
                    {name: 'zustand/traditional', message: 'Legacy store pattern. Use create<T>()'},
                    {name: 'axios', message: 'Use AuthApi.getInstance() — CSRF + 401 refresh live there'},
                ],
                patterns: [
                    {group: ['../../*'], message: 'Use tsconfig path aliases (@stores/…, @api/…)'},
                ],
            }],
            'no-restricted-syntax': ['error', {
                selector: "ImportSpecifier[imported.name=/^(Text|TextContent)$/]",
                message: 'Removed in PatternFly 6 — use Content',
            }],
        },
    },
);