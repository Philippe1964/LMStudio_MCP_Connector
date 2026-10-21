---
name: typescript-vite-expert
description: >-
  Comprehensive engineering runbook and best practices for modern JavaScript, TypeScript 5.7+,
  React 19, and Vite 6+ development in the Presentation tier. Activate this skill whenever
  creating, modifying, configuring, or reviewing frontend components, TypeScript configurations,
  Vite build pipelines, or Nginx SPA integrations.
---

# JavaScript / TypeScript / React 19 / Vite Expert Skill

Use this skill to design, build, type-check, and package production-grade frontend applications in `frontend/` for the Presentation tier (`<project>-presentation`).

## 1. Strict TypeScript & Vite Configuration

1. **`tsconfig.json` Standards**:
   - Always enable strict mode and compiler checks:
     - `"strict": true`
     - `"noUnusedLocals": true`
     - `"noUnusedParameters": true`
     - `"noFallthroughCasesInSwitch": true`
     - `"isolatedModules": true`
     - `"moduleResolution": "bundler"`
     - `"types": ["vite/client"]`
   - Ensure `"include": ["src", "vite.config.ts"]` is set so both application code and Vite build config are validated by the TypeScript language server.

2. **Vite Environment Type Declarations (`src/vite-env.d.ts`)**:
   - Always include `/// <reference types="vite/client" />` and `declare module "*.css";` in `frontend/src/vite-env.d.ts` so side-effect stylesheet imports (`import "./App.css";`) and `import.meta.env` are strictly typed without IDE errors.

3. **Forbidden TypeScript Anti-Patterns**:
   - **Never use `any`** or `@ts-ignore` / `@ts-nocheck`. Prefer explicit `interface`, discriminated unions, `unknown` with type narrowing, or generic type parameters `<T>`.
   - **Never leave unhandled Promises**: Prefix fire-and-forget async calls in `useEffect` or event handlers with `void` (e.g., `void fetchData();`) and always handle rejections inside `try / catch`.

---

## 2. Frontend Architecture & React 19 Best Practices

Organize `frontend/src/` with clear separation of concerns:
- `src/types/`: Pure TypeScript interfaces and type aliases mirroring the FastAPI Application layer DTOs (`*RequestDto`, `*ResponseDto`).
- `src/pages/`: Top-level route views (e.g., `ApplicationHomePage.tsx`, `HealthCheckPage.tsx`).
- `src/components/`: Reusable, stateless or focused UI components with explicit Props interfaces.
- `src/services/` or `src/hooks/`: Encapsulated HTTP API calls (`fetch` with `Accept: "application/json"`, `cache: "no-store"` when real-time telemetry is required, and proper HTTP status validation `if (!response.ok)`).

### React 19 Idioms
- Use named functional components with explicit props typing:
  ```tsx
  interface MetricCardProps {
    readonly title: string;
    readonly value: number;
  }

  export function MetricCard({ title, value }: MetricCardProps) {
    return (
      <article>
        <h3>{title}</h3>
        <strong>{value}</strong>
      </article>
    );
  }
  ```
- Clean up all timers, subscriptions, and event listeners in `useEffect` return functions (`return () => window.clearInterval(timer);`).

---

## 3. Multi-Stage Docker & Nginx SPA Integration (`<project>-presentation`)

1. **Coexistence in the Presentation Container**:
   - The Vite build (`base: "/"`) compiles both the business application (`/`) and the health check dashboard (`/health-check`) into `/usr/share/nginx/html`.
   - Nginx must proxy backend API prefixes (`/api/*`, `/health`, `/docs`, `/redoc`, `/openapi.json`) to `<project>-business:8000` and serve the React SPA via `try_files $uri $uri/ /index.html;` for all client-side routes.
2. **Local IDE Support**:
   - Ensure `frontend/node_modules` is populated locally (via `npm install` or container mount when Node.js is not installed on the host) so the IDE TypeScript server resolves `react`, `react-dom`, and `vite` declarations without warnings.

---

## 4. Quality Assurance & Verification Workflow

Before concluding any frontend modification, execute:
1. **TypeScript Compiler Verification**:
   ```powershell
   npx tsc -b --noEmit
   ```
   *(Or via Docker if Node.js is not in host PATH: `docker run --rm -v "${PWD}/frontend:/frontend" -w /frontend node:22-alpine npx tsc -b --noEmit`)*
2. **Production Bundle Verification**:
   ```powershell
   npm run build
   ```

