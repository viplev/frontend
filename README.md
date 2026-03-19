# VIPLEV Frontend

A React + TypeScript + Vite frontend for the VIPLEV performance benchmarking platform.

## Project Setup

```bash
npm install
cp .env.example .env       # Configure API base URL
npm run dev                # Start dev server
npm run build              # Production build
npm run generate           # Regenerate OpenAPI client from openapi.yaml
```

## Project Issues / Backlog

All development tasks are tracked as GitHub Issues. When this PR is merged to `main`,
the **Create Project Issues** workflow fires automatically and creates all 12 planned
issues (with labels, priorities, sizes, area tags, and blocking relationships).

To create the issues manually before the merge, go to:

> **Actions → Create Project Issues → Run workflow**

> ⚠️ The workflow is idempotent and will skip creation if any issues already exist, preventing duplicates. It is safe to run multiple times.

### Issue overview

| # | Title | Priority | Size | Area | Blocks |
|---|-------|----------|------|------|--------|
| 1 | Project Foundation (routing, state, API client) | P1 Critical | L | Infrastructure | All |
| 2 | Login Page and Auth Flow | P1 Critical | M | Auth | 3-12 |
| 3 | Application Shell and Navigation Layout | P2 High | M | UI / Layout | 5-12 |
| 4 | Form Partial Save (localStorage persistence) | P2 High | S | Forms | 6, 7, 8 |
| 5 | Environments List Page | P2 High | M | Environment | 6, 7, 8 |
| 6 | Create / Edit Environment Form | P2 High | M | Environment + Forms | — |
| 7 | Services List and Registration Form | P3 Medium | M | Services + Forms | — |
| 8 | Benchmarks List and Create/Edit Form | P2 High | L | Benchmark + Forms | 9, 10 |
| 9 | Benchmark Start / Stop Actions | P2 High | S | Benchmark + Runs | 10 |
| 10 | Benchmark Runs List and Dashboard | P2 High | M | Runs | 11 |
| 11 | Run Detail View and Metrics Visualisation | P2 High | XL | Runs + Analytics | — |
| 12 | Messages and Notifications Centre | P4 Low | S | Notifications | — |

---

## React + TypeScript + Vite (template info)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

