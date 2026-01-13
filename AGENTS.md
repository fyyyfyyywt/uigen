    # Agents Guide

This file provides guidance for agentic coding agents working on this repository.

## 1. Build, Lint, and Test Commands

*   **Build Project**:
    ```bash
    npm run build
    ```
    *   Use this to validate types and build for production.

*   **Start Development Server**:
    ```bash
    npm run dev
    ```
    *   Runs on `http://localhost:3000` with Turbopack.

*   **Lint Code**:
    ```bash
    npm run lint
    ```
    *   Runs Next.js ESLint configuration.

*   **Run All Tests**:
    ```bash
    npm run test
    ```
    *   Uses Vitest.

*   **Run a Single Test File**:
    ```bash
    npx vitest run path/to/test.test.ts
    ```
    *   *Crucial for agents*: Always run specific tests relevant to your changes rather than the whole suite during development.

*   **Database Setup**:
    ```bash
    npm run setup
    ```
    *   Installs dependencies, generates Prisma client, and runs migrations.

## 2. Code Style & Conventions

### General
*   **Language**: TypeScript (Strict mode enabled in `tsconfig.json`).
*   **Framework**: Next.js 15 (App Router), React 19.
*   **Styling**: Tailwind CSS v4.

### Formatting
*   **Indentation**: 2 spaces.
*   **Quotes**: Double quotes `"` for strings and imports.
*   **Semicolons**: Always use semicolons.
*   **Trailing Commas**: Use trailing commas in multi-line objects/arrays.

### Naming Conventions
*   **Files & Directories**: `kebab-case` (e.g., `create-project.ts`, `button.tsx`, `file-system.test.ts`).
    *   *Exception*: Special Next.js files like `page.tsx`, `layout.tsx` are fixed.
    *   *Exception*: Dynamic routes `[param]`.
*   **React Components**: `PascalCase` (e.g., `Button`, `HeaderActions`).
*   **Functions & Variables**: `camelCase` (e.g., `createProject`, `getSession`).
*   **Interfaces/Types**: `PascalCase` (e.g., `CreateProjectInput`, `Project`).

### Imports
*   **Path Alias**: Use `@/` for imports from `src/` (e.g., `import { cn } from "@/lib/utils"`).
*   **React**: `import * as React from "react"`.
*   **Grouping**:
    1.  React / Next.js built-ins.
    2.  Third-party libraries (e.g., `@radix-ui`, `lucide-react`).
    3.  Local internal modules (`@/lib`, `@/components`).

### Component Architecture (UI)
*   Follow **shadcn/ui** patterns.
*   Use `class-variance-authority` (`cva`) for component variants.
*   Use `cn()` utility (from `@/lib/utils`) to merge Tailwind classes.
*   Support polymorphism via `asChild` prop (using `@radix-ui/react-slot`).
*   **Example**:
    ```tsx
    import * as React from "react"
    import { Slot } from "@radix-ui/react-slot"
    import { cva, type VariantProps } from "class-variance-authority"
    import { cn } from "@/lib/utils"

    const buttonVariants = cva("...", { ... })

    function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
      const Comp = asChild ? Slot : "button"
      return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
    }
    ```

### Server Actions
*   Located in `src/actions/`.
*   Must start with `"use server";`.
*   **Error Handling**: Throw standard `Error` objects for failures (e.g., `throw new Error("Unauthorized")`).
*   **Validation**: Define interfaces for input arguments.
*   **Database**: Use `prisma` from `@/lib/prisma`.
*   **Auth**: Use `getSession` from `@/lib/auth` to verify user identity.

### Testing
*   **Framework**: Vitest.
*   **Location**: `src/lib/__tests__/` or co-located `__tests__` directories.
*   **Imports**: `import { test, expect } from "vitest"`.
*   **Pattern**: Write focused unit tests for logic in `src/lib`.

### Database (Prisma)
*   Schema: `prisma/schema.prisma`.
*   Client: Import from `@/lib/prisma`.
*   Do not manually instantiate `PrismaClient`; use the singleton instance.

## 3. Environment & Rules
*   **File System**: The project uses a Virtual File System (`src/lib/file-system.ts`) for some operations. Be aware when modifying code related to file generation/management.
*   **No Reverting**: Do not revert changes unless explicitly asked.
*   **Safety**: Always verify critical paths before deletion (e.g., `rm -rf`).

## 4. Deployment Awareness

This project is deployed using **Docker** on a VPS, accessed via a **Reverse Proxy** from a separate Webhost.

*   **Base Path**: The application runs under `/uigen`.
    *   `next.config.ts` has `basePath: "/uigen"`.
    *   `middleware.ts` expects `/uigen` prefix for protected routes.
    *   `chat-context.tsx` uses absolute API paths (e.g., `/uigen/api/chat`).
*   **Access**:
    *   VPS Port: `3000` (Internal Only - Routed via Traefik).
    *   Public URL: `https://uigen.tiancreates.com`.
*   **Infrastructure**:
    *   `docker-compose.yml` orchestrates the App and Redis.
    *   Hostinger (Apache) handles the Reverse Proxy via `.htaccess`.

