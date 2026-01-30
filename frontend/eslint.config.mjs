import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript recommended rules
    ...tseslint.configs.recommended,

    // Global ignores
    {
        ignores: ['build/**', 'node_modules/**', 'coverage/**', '*.config.js', '*.config.mjs'],
    },

    // React configuration
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.jest,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // React rules
            'react/react-in-jsx-scope': 'off', // Not needed in React 17+
            'react/prop-types': 'off', // Using TypeScript
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'off', // Relaxed per existing config

            // TypeScript rules (relaxed to match existing config)
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',

            // General rules
            'prefer-const': 'error',
            'no-var': 'error',
            'no-useless-escape': 'off',
        },
    },

    // Test files configuration
    {
        files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },

    // Mock files (CommonJS)
    {
        files: ['src/__mocks__/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
                module: 'readonly',
                jest: 'readonly',
            },
        },
    }
);
