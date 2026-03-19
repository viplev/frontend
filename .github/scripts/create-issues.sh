#!/usr/bin/env bash
# =============================================================================
# create-issues.sh - Creates all project planning GitHub Issues for VIPLEV
#
# Usage:
#   REPO=<owner/repo> GH_TOKEN=<your_token> bash .github/scripts/create-issues.sh
#   OR: gh auth login && REPO=viplev/frontend bash .github/scripts/create-issues.sh
#
# Environment variables:
#   REPO      - GitHub repository in owner/repo format (default: viplev/frontend)
#   GH_TOKEN  - GitHub token with issues:write scope (optional if already logged in via gh)
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated
#   - Write access to the repository (issues:write scope)
# =============================================================================

set -euo pipefail

# Allow the repo to be overridden via environment (e.g. from the workflow context)
REPO="${REPO:-viplev/frontend}"

echo "Creating labels..."

# ------------------------------------------------------------------
# Priority labels
# ------------------------------------------------------------------
gh label create "P1 - Critical"  --color "d73a4a" --description "Highest priority; blocks all other work"           --repo "$REPO" --force
gh label create "P2 - High"      --color "e4b429" --description "Important feature; should be completed soon"       --repo "$REPO" --force
gh label create "P3 - Medium"    --color "0075ca" --description "Normal priority; complete after P1/P2 items"       --repo "$REPO" --force
gh label create "P4 - Low"       --color "cfd3d7" --description "Nice to have; complete when time permits"          --repo "$REPO" --force

# ------------------------------------------------------------------
# Size / effort labels  (story-point style)
# ------------------------------------------------------------------
gh label create "Size: XS"  --color "bfd4f2" --description "< 2 hours of work"          --repo "$REPO" --force
gh label create "Size: S"   --color "bfd4f2" --description "Half a day of work"          --repo "$REPO" --force
gh label create "Size: M"   --color "bfd4f2" --description "1-2 days of work"            --repo "$REPO" --force
gh label create "Size: L"   --color "bfd4f2" --description "3-5 days of work"            --repo "$REPO" --force
gh label create "Size: XL"  --color "bfd4f2" --description "1-2 weeks of work"           --repo "$REPO" --force

# ------------------------------------------------------------------
# Area labels
# ------------------------------------------------------------------
gh label create "Area: Infrastructure" --color "5319e7" --description "Build tooling, project setup, shared utilities" --repo "$REPO" --force
gh label create "Area: Auth"           --color "5319e7" --description "Authentication and authorisation"               --repo "$REPO" --force
gh label create "Area: UI / Layout"    --color "5319e7" --description "Application shell, navigation, global layout"  --repo "$REPO" --force
gh label create "Area: Forms"          --color "5319e7" --description "Form behaviour, validation, persistence"        --repo "$REPO" --force
gh label create "Area: Environment"    --color "5319e7" --description "Environment management features"                --repo "$REPO" --force
gh label create "Area: Services"       --color "5319e7" --description "Service registration and management"            --repo "$REPO" --force
gh label create "Area: Benchmark"      --color "5319e7" --description "Benchmark creation and management"              --repo "$REPO" --force
gh label create "Area: Runs"           --color "5319e7" --description "Benchmark run execution and status"             --repo "$REPO" --force
gh label create "Area: Analytics"      --color "5319e7" --description "Metrics, charts, and analytics dashboards"      --repo "$REPO" --force
gh label create "Area: Notifications"  --color "5319e7" --description "Messages and notifications centre"              --repo "$REPO" --force

echo "All labels created."
echo ""
echo "Creating issues..."

# =============================================================================
# ISSUE 1 – Project Foundation Setup
# =============================================================================
ISSUE_1=$(gh issue create \
  --repo "$REPO" \
  --title "[FOUNDATION] Set up project foundation – routing, state management, and API client" \
  --label "P1 - Critical,Size: L,Area: Infrastructure" \
  --body "## Summary
Bootstrap the application with all shared infrastructure before any feature work begins. Every other issue depends on this one.

---

## Importance
**P1 – Critical**
This is the single most important issue. All other issues are blocked until the work here is done.

## Expected Size
**L (3-5 days)**

## Area
Infrastructure

---

## Blocking
> **This issue blocks:** Issues #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, #12

---

## Actionable Tasks

### 1. Install and configure React Router v6
- Run \`npm install react-router-dom\`
- Create \`src/router/index.tsx\` that defines the top-level route tree (placeholder routes for every future page listed in this project).
- Wrap \`<App>\` in \`<BrowserRouter>\` inside \`src/main.tsx\`.

### 2. Set up global state management
- Run \`npm install zustand\`
- Create \`src/store/authStore.ts\` – holds the JWT access token, decoded user info (email, roles), and an \`isAuthenticated\` boolean.
- Create \`src/store/uiStore.ts\` – holds transient UI state such as sidebar collapsed/expanded state and global loading/error flags.

### 3. Configure the auto-generated OpenAPI client
- Run \`npm run generate\` (or equivalent) to ensure \`src/generated/openapi/\` is up to date from \`openapi.yaml\`.
- Create \`src/api/client.ts\` that instantiates the generated \`Configuration\` and wraps every API class, injecting:
  - The \`basePath\` from an \`VITE_API_BASE_URL\` environment variable.
  - An \`accessToken\` getter that reads from \`authStore\`.
- Export one singleton per API tag (e.g. \`authApi\`, \`environmentApi\`, \`benchmarkApi\`, \`benchmarkRunApi\`, \`agentApi\`).

### 4. Create a shared Axios interceptor (or fetch wrapper)
- If the generated client does not natively support interceptors, wrap it with a thin Axios or native-fetch layer in \`src/api/interceptors.ts\`.
- Intercept 401 responses and redirect to the login page.
- Intercept all requests to attach the \`Authorization: Bearer <token>\` header.

### 5. Create a \`.env.example\` file
\`\`\`
VITE_API_BASE_URL=http://localhost:3000
\`\`\`
Document each variable in the README.

### 6. TypeScript path aliases
- Add \`@/\` path alias in \`tsconfig.json\` (pointing to \`src/\`) and in \`vite.config.ts\` so all imports use \`@/api/…\`, \`@/store/…\`, etc.

### 7. Clean up the placeholder template
- Remove the default Vite/React counter component from \`src/App.tsx\`.
- Replace it with \`<RouterProvider>\` rendering the route tree.

### 8. Acceptance criteria
- \`npm run dev\` starts without errors.
- Navigating to \`/\` renders without crash.
- The \`authStore\` is importable and readable in any component.
- The generated API client can be imported and called in a test component without TypeScript errors.
" 2>&1)

echo "Issue 1 URL: $ISSUE_1"

# =============================================================================
# ISSUE 2 – Authentication
# =============================================================================
ISSUE_2=$(gh issue create \
  --repo "$REPO" \
  --title "[AUTH] Implement Login Page and full authentication flow" \
  --label "P1 - Critical,Size: M,Area: Auth" \
  --body "## Summary
Build the login page, store the JWT token securely, protect all routes, and implement logout. Until users can log in the entire application is inaccessible.

---

## Importance
**P1 – Critical**

## Expected Size
**M (1-2 days)**

## Area
Auth

---

## Blocking / Blocked by
> **Blocked by:** Issue #1 (Foundation)
> **Blocks:** Issues #3, #5, #6, #7, #8, #9, #10, #11, #12

---

## Actionable Tasks

### 1. Create the Login page (\`src/pages/LoginPage.tsx\`)
- Layout: centred card with VIPLEV logo at the top.
- Fields: **Email** (type=email, required) and **Password** (type=password, required).
- Show client-side validation messages inline before the form is submitted (e.g. \"Email is required\", \"Password must be at least 8 characters\").
- Show a spinner on the Submit button while the API call is in flight.
- Show a red alert banner under the form for API errors (e.g. invalid credentials, server error).

### 2. Wire up the login API call
- On submit, call \`authApi.login({ loginDTO: { email, password } })\`.
- On success: store the returned token in \`authStore\` (Zustand) **and** in \`localStorage\` under the key \`viplev_access_token\` so the session survives page refreshes.
- Redirect to \`/environments\` (home dashboard) after a successful login.
- On error: surface the error message to the user (see task 1).

### 3. Hydrate auth state on app load
- In \`src/main.tsx\` (or an \`AuthProvider\`), read \`viplev_access_token\` from \`localStorage\` on every cold start and populate \`authStore\` with it.

### 4. Create a \`ProtectedRoute\` component (\`src/components/auth/ProtectedRoute.tsx\`)
- Wraps any route that requires authentication.
- If \`authStore.isAuthenticated === false\`, redirect to \`/login\` preserving the original \`location\` as state so users are taken back after logging in.

### 5. Apply \`ProtectedRoute\` to all routes except \`/login\`
- Update the route tree from Issue #1 so every route except \`/login\` is wrapped in \`<ProtectedRoute>\`.

### 6. Implement Logout
- Add a \`logout()\` action to \`authStore\` that clears the token from state **and** from \`localStorage\`.
- Hook this action up to the logout button that will be placed in the navigation (see Issue #3).

### 7. Acceptance criteria
- Navigating to any protected route while unauthenticated redirects to \`/login\`.
- Entering valid credentials logs the user in and redirects to \`/environments\`.
- Entering invalid credentials shows a user-friendly error message.
- Refreshing the page keeps the user logged in.
- Clicking Logout clears the session and redirects to \`/login\`.
" 2>&1)

echo "Issue 2 URL: $ISSUE_2"

# =============================================================================
# ISSUE 3 – Application Shell & Navigation
# =============================================================================
ISSUE_3=$(gh issue create \
  --repo "$REPO" \
  --title "[UI] Build Application Shell and Navigation Layout" \
  --label "P2 - High,Size: M,Area: UI / Layout" \
  --body "## Summary
Create the persistent application shell—sidebar navigation, top header, breadcrumbs, and page content area—that every authenticated page will be rendered inside.

---

## Importance
**P2 – High**

## Expected Size
**M (1-2 days)**

## Area
UI / Layout

---

## Blocking / Blocked by
> **Blocked by:** Issue #1 (Foundation), Issue #2 (Auth)
> **Blocks:** Issues #5, #6, #7, #8, #9, #10, #11, #12

---

## Actionable Tasks

### 1. Create the \`AppShell\` layout component (\`src/layouts/AppShell.tsx\`)
- Fixed sidebar on the left (~240 px wide).
- Top header bar with: application name/logo on the left, user email and Logout button on the right.
- Main content area to the right of the sidebar that renders \`<Outlet />\` (React Router).

### 2. Sidebar navigation links
Build a \`<NavLink>\`-based sidebar menu with the following top-level items (all protected):
| Label | Route |
|---|---|
| Environments | \`/environments\` |

Each item should highlight when its route is active.

### 3. Breadcrumb component (\`src/components/ui/Breadcrumbs.tsx\`)
- Auto-generate breadcrumbs from the current route segments (e.g. Environments > \`my-env\` > Benchmarks > \`bench-1\` > Runs).
- Use React Router \`useMatches()\` hook with route \`handle.breadcrumb\` metadata to drive this.

### 4. Global loading and error state
- Add a full-page loading spinner shown when any top-level data fetch is in progress (driven by \`uiStore.isLoading\`).
- Add a global \`<ErrorBoundary>\` around \`<AppShell>\` that catches unexpected JS errors and shows a friendly \"Something went wrong\" fallback UI with a Retry button.

### 5. Responsive design
- On screens < 768 px, the sidebar should collapse to a hamburger-menu icon in the header that opens a drawer.
- Use Tailwind CSS breakpoint utilities (\`md:\`) for all responsive rules.

### 6. Dark-mode placeholder
- Add a light/dark toggle button in the header (can be a no-op stub for now) so the design handles the future dark-mode issue without needing a full layout rework.

### 7. Wrap all protected routes with \`AppShell\`
- Update the route tree so that every protected route is a child of a parent route that renders \`<AppShell>\`.

### 8. Acceptance criteria
- Every protected page renders inside the shell with a visible sidebar and header.
- Active nav links are visually highlighted.
- Breadcrumbs update correctly when navigating between pages.
- On mobile the sidebar is hidden behind a toggle.
" 2>&1)

echo "Issue 3 URL: $ISSUE_3"

# =============================================================================
# ISSUE 4 – Form Partial Save (LocalStorage Persistence)
# =============================================================================
ISSUE_4=$(gh issue create \
  --repo "$REPO" \
  --title "[FORMS] Implement form partial-save so data is never lost on page reload" \
  --label "P2 - High,Size: S,Area: Forms,Area: Infrastructure" \
  --body "## Summary
Users filling in long forms must not lose their work if they accidentally close the tab, navigate away, or the page reloads. All forms in the application must persist their in-progress data to \`localStorage\` and restore it automatically.

---

## Importance
**P2 – High** — Data loss is a significant UX issue; any form that takes non-trivial input must have partial save.

## Expected Size
**S (half a day)**

## Area
Forms / Infrastructure

---

## Blocking / Blocked by
> **Blocked by:** Issue #1 (Foundation)
> **Blocks:** Issue #6 (Environment Form), Issue #7 (Services Form), Issue #8 (Benchmark Form)

---

## Actionable Tasks

### 1. Create the \`useFormPersistence\` custom hook (\`src/hooks/useFormPersistence.ts\`)
The hook signature should be:
\`\`\`ts
function useFormPersistence<T extends object>(
  key: string,
  defaultValues: T
): {
  savedValues: T;
  clearSaved: () => void;
}
\`\`\`
- On mount, read \`localStorage.getItem(key)\` and parse JSON.  Fall back to \`defaultValues\` if nothing is stored or parsing fails.
- Export a \`clearSaved()\` function that removes the key from \`localStorage\` (call this on successful form submission).
- The key should be namespaced to avoid collisions: e.g. \`viplev_form_<key>\`.

### 2. Create the \`useAutoSave\` custom hook (\`src/hooks/useAutoSave.ts\`)
The hook signature should be:
\`\`\`ts
function useAutoSave<T extends object>(
  key: string,
  values: T,
  debounceMs?: number   // default 500
): void
\`\`\`
- Watches \`values\` and debounces writes to \`localStorage\` by \`debounceMs\` milliseconds to avoid thrashing storage on every keystroke.
- Serialises the values as JSON.

### 3. Integrate with React Hook Form (install if not present)
- Run \`npm install react-hook-form @hookform/resolvers zod\`
- In each form that uses partial save:
  1. Call \`useFormPersistence\` to get \`savedValues\`.
  2. Pass \`savedValues\` as the \`defaultValues\` to \`useForm\`.
  3. Call \`useAutoSave\` with the current \`watch()\` values.
  4. Call \`clearSaved()\` inside the \`onSubmit\` handler after a successful API call.

### 4. Show a \"Restoring saved draft\" banner
- If the hook detects saved data on mount, show a dismissible info banner above the form:
  > \"📋 We found a saved draft from your last session. Your data has been restored.\"
- Include a \"Clear draft\" button that calls \`clearSaved()\` and resets the form to \`defaultValues\`.

### 5. Handle edit forms (existing data)
- For edit forms that load data from the API, partial save should only apply to **changes made since the last page load**.
- Strategy: persist only the form's \`dirtyFields\` (available from \`react-hook-form\` \`formState\`), not the full object.

### 6. Unit tests (\`src/hooks/__tests__/useFormPersistence.test.ts\`)
- Test that values are written to \`localStorage\` after the debounce period.
- Test that values are restored from \`localStorage\` on re-mount.
- Test that \`clearSaved()\` removes the key.

### 7. Acceptance criteria
- Fill in a form, navigate away, and come back — the form is pre-filled with the last-entered values.
- Successfully submitting a form clears the saved draft.
- A visible banner informs the user that a draft was restored.
- The hooks are re-usable and applied to all forms in Issues #6, #7, and #8.
" 2>&1)

echo "Issue 4 URL: $ISSUE_4"

# =============================================================================
# ISSUE 5 – Environments List Page
# =============================================================================
ISSUE_5=$(gh issue create \
  --repo "$REPO" \
  --title "[ENV] Build the Environments List page" \
  --label "P2 - High,Size: M,Area: Environment" \
  --body "## Summary
The Environments List page is the home dashboard for authenticated users. It displays all of their benchmarking environments and provides entry points into environment detail, benchmark management, and deletion.

---

## Importance
**P2 – High** — the primary entry-point for the entire application.

## Expected Size
**M (1-2 days)**

## Area
Environment Management

---

## Blocking / Blocked by
> **Blocked by:** Issue #2 (Auth), Issue #3 (App Shell)
> **Blocks:** Issue #6 (Create/Edit Environment Form), Issue #7 (Services), Issue #8 (Benchmarks)

---

## Actionable Tasks

### 1. Create the page component (\`src/pages/environments/EnvironmentListPage.tsx\`)
- Fetch the list of environments on mount using \`environmentApi.listEnvironments()\`.
- Show a skeleton loader while fetching.
- Show an empty-state illustration + \"Create your first environment\" button if the list is empty.
- Show an error alert with a Retry button if the API call fails.

### 2. Environment card / table row component
- Display per environment: name, description (truncated to 2 lines), creation date, number of benchmarks (if available).
- Action buttons per row: **View/Edit** and **Delete**.

### 3. Delete Environment flow
- Clicking Delete opens a confirmation modal: \"Are you sure you want to delete \`{name}\`? This will also delete all benchmarks and runs in this environment.\"
- On confirm: call \`environmentApi.deleteEnvironment({ environmentId })\` and remove the item from the list optimistically.
- On error: show an inline error and restore the item.

### 4. \"Create New Environment\" button
- Prominent CTA at the top-right of the page.
- Routes to the Create Environment form (Issue #6).

### 5. Navigation to environment detail
- Clicking the environment name or \"View\" button navigates to \`/environments/:environmentId\` which is the parent layout for benchmarks, services, and settings.

### 6. Register the route
- Add \`/environments\` → \`<EnvironmentListPage>\` as a child route inside the \`<AppShell>\` route tree.

### 7. Acceptance criteria
- All environments are listed after login.
- Deleting an environment removes it from the list with a success toast notification.
- Empty state is shown when no environments exist.
- Navigating to an environment goes to the correct detail route.
" 2>&1)

echo "Issue 5 URL: $ISSUE_5"

# =============================================================================
# ISSUE 6 – Create / Edit Environment Form
# =============================================================================
ISSUE_6=$(gh issue create \
  --repo "$REPO" \
  --title "[ENV] Create and Edit Environment form with partial save" \
  --label "P2 - High,Size: M,Area: Environment,Area: Forms" \
  --body "## Summary
Forms to create a new environment and to edit an existing one. Both forms must use the partial-save mechanism from Issue #4 so no data is ever lost on reload.

---

## Importance
**P2 – High**

## Expected Size
**M (1-2 days)**

## Area
Environment Management / Forms

---

## Blocking / Blocked by
> **Blocked by:** Issue #4 (Form Partial Save), Issue #5 (Environments List)
> **Blocks:** None directly (but unblocks fuller environment workflow)

---

## Actionable Tasks

### 1. Understand the \`EnvironmentDTO\` schema
- Open \`openapi.yaml\` and inspect \`#/components/schemas/EnvironmentDTO\`.
- Map every field to the appropriate HTML input type and Zod validation rule.

### 2. Create the shared form component (\`src/components/environments/EnvironmentForm.tsx\`)
Build a single form component used for both create and edit:
- All fields from \`EnvironmentDTO\` with appropriate labels, placeholders, and validation messages.
- Use \`react-hook-form\` with a \`zod\` schema resolver.
- Integrate \`useFormPersistence\` and \`useAutoSave\` (Issue #4) with key \`environment_form_<environmentId | 'new'>\`.

### 3. Create Page: \`src/pages/environments/CreateEnvironmentPage.tsx\`
- Renders \`<EnvironmentForm>\` with empty default values.
- On submit: calls \`environmentApi.createEnvironment({ environmentDTO: values })\`.
- On success: calls \`clearSaved()\`, shows a success toast, and redirects to the new environment detail page.
- On error: shows an inline error alert.

### 4. Edit Page: \`src/pages/environments/EditEnvironmentPage.tsx\`
- Loads existing environment data via \`environmentApi.getEnvironment({ environmentId })\`.
- Pre-fills \`<EnvironmentForm>\` with the fetched values.
- On submit: calls \`environmentApi.updateEnvironment({ environmentId, environmentDTO: values })\`.
- On success: calls \`clearSaved()\`, shows a success toast, and navigates back to the environment list.
- On error: shows an inline error alert.

### 5. Register routes
- \`/environments/new\` → \`<CreateEnvironmentPage>\`
- \`/environments/:environmentId/edit\` → \`<EditEnvironmentPage>\`

### 6. Acceptance criteria
- All \`EnvironmentDTO\` fields have validation and labels.
- Partial save: closing the tab mid-fill and reopening the create form restores the draft.
- Submitting the form navigates to the correct next page and shows a success toast.
- Editing an existing environment pre-fills the form with its current values.
- A \"Restoring saved draft\" banner is visible when a draft is present.
" 2>&1)

echo "Issue 6 URL: $ISSUE_6"

# =============================================================================
# ISSUE 7 – Services
# =============================================================================
ISSUE_7=$(gh issue create \
  --repo "$REPO" \
  --title "[SVC] Services list view and agent service registration form" \
  --label "P3 - Medium,Size: M,Area: Services,Area: Forms" \
  --body "## Summary
Display services registered against an environment and provide a read-only view for each service's details. The registration form (used by automated agents) should also be visible in the UI for debugging and manual operation, with partial-save support.

---

## Importance
**P3 – Medium**

## Expected Size
**M (1-2 days)**

## Area
Services

---

## Blocking / Blocked by
> **Blocked by:** Issue #4 (Form Partial Save), Issue #5 (Environments List), Issue #3 (App Shell)
> **Blocks:** None

---

## Actionable Tasks

### 1. Services list component (\`src/pages/environments/ServicesPage.tsx\`)
- Fetch services with \`environmentApi.listServices({ environmentId })\`.
- Display as a table: service name, endpoint/URL, type, description.
- Show a skeleton loader while fetching and an empty state if no services exist.

### 2. Service detail drawer or modal
- Clicking a service name opens a read-only detail panel showing all service fields.

### 3. Register Services form (\`src/components/services/RegisterServicesForm.tsx\`)
- Allows manual registration of one or more services (\`ServiceDTO[]\` array).
- Dynamic list with an \"Add another service\" button and a remove button per row.
- Integrate \`useFormPersistence\` / \`useAutoSave\` (Issue #4) with key \`services_form_<environmentId>\`.
- On submit: calls \`environmentApi.registerServices({ environmentId, serviceDTO: values })\`.
- On success: clears the draft, shows a success toast, and refreshes the services list.

### 4. Navigation
- Add a \"Services\" tab or sidebar sub-item under each environment (route \`/environments/:environmentId/services\`).

### 5. Acceptance criteria
- All services for an environment are listed.
- Partial save: navigating away from the form mid-fill and returning restores the draft.
- Successfully registering services refreshes the list.
" 2>&1)

echo "Issue 7 URL: $ISSUE_7"

# =============================================================================
# ISSUE 8 – Benchmarks List + Create/Edit Form
# =============================================================================
ISSUE_8=$(gh issue create \
  --repo "$REPO" \
  --title "[BENCH] Benchmarks list page and Create/Edit benchmark form with partial save" \
  --label "P2 - High,Size: L,Area: Benchmark,Area: Forms" \
  --body "## Summary
The Benchmarks section is the core of the VIPLEV application. Users must be able to list, create, edit, and delete benchmarks within an environment. All forms must use partial save.

---

## Importance
**P2 – High**

## Expected Size
**L (3-5 days)**

## Area
Benchmark Management / Forms

---

## Blocking / Blocked by
> **Blocked by:** Issue #4 (Form Partial Save), Issue #5 (Environments List), Issue #3 (App Shell)
> **Blocks:** Issue #9 (Start/Stop Actions), Issue #10 (Runs List)

---

## Actionable Tasks

### 1. Benchmarks list page (\`src/pages/benchmarks/BenchmarkListPage.tsx\`)
- Route: \`/environments/:environmentId/benchmarks\`
- Fetch benchmarks with \`benchmarkApi.listBenchmarks({ environmentId })\`.
- Display as a table/card grid with: name, description, status badge, last-run date, action buttons.
- Empty state with a \"Create your first benchmark\" CTA.
- Delete benchmark flow: confirmation modal → \`benchmarkApi.deleteBenchmark({ environmentId, benchmarkId })\`.

### 2. Understand the \`BenchmarkDTO\` schema
- Open \`openapi.yaml\` and inspect \`#/components/schemas/BenchmarkDTO\`.
- Map every field to an HTML input and Zod validation rule.

### 3. Create the shared form component (\`src/components/benchmarks/BenchmarkForm.tsx\`)
- All fields from \`BenchmarkDTO\` with labels, placeholders, and validation messages.
- Use \`react-hook-form\` with Zod schema resolver.
- Integrate \`useFormPersistence\` / \`useAutoSave\` (Issue #4) with key \`benchmark_form_<benchmarkId | 'new'>_<environmentId>\`.

### 4. Create Benchmark Page (\`src/pages/benchmarks/CreateBenchmarkPage.tsx\`)
- Route: \`/environments/:environmentId/benchmarks/new\`
- On submit: \`benchmarkApi.createBenchmark({ environmentId, benchmarkDTO: values })\`.
- On success: clear draft, show success toast, redirect to benchmark detail.

### 5. Edit Benchmark Page (\`src/pages/benchmarks/EditBenchmarkPage.tsx\`)
- Route: \`/environments/:environmentId/benchmarks/:benchmarkId/edit\`
- Pre-fill form from \`benchmarkApi.getBenchmark({ environmentId, benchmarkId })\`.
- On submit: \`benchmarkApi.updateBenchmark({ environmentId, benchmarkId, benchmarkDTO: values })\`.
- On success: clear draft, show success toast.

### 6. Benchmark detail page / overview
- Route: \`/environments/:environmentId/benchmarks/:benchmarkId\`
- Shows benchmark metadata, last-run summary, and action buttons (Start, View Runs, Edit, Delete).

### 7. Acceptance criteria
- Benchmarks are listed per environment.
- Creating a benchmark and refreshing the page shows the new item in the list.
- Partial save: closing the tab mid-form and returning restores the draft with a visible banner.
- Editing a benchmark pre-fills the form with current values.
- Deleting a benchmark removes it from the list with a success toast.
" 2>&1)

echo "Issue 8 URL: $ISSUE_8"

# =============================================================================
# ISSUE 9 – Benchmark Start / Stop Actions
# =============================================================================
ISSUE_9=$(gh issue create \
  --repo "$REPO" \
  --title "[BENCH] Benchmark Execution – Start and Stop actions" \
  --label "P2 - High,Size: S,Area: Benchmark,Area: Runs" \
  --body "## Summary
Allow users to start a benchmark (triggering a new run) and stop a currently in-progress run directly from the UI.

---

## Importance
**P2 – High**

## Expected Size
**S (half a day)**

## Area
Benchmark / Runs

---

## Blocking / Blocked by
> **Blocked by:** Issue #8 (Benchmarks)
> **Blocks:** Issue #10 (Runs List)

---

## Actionable Tasks

### 1. \"Start Benchmark\" button
- Location: benchmark detail page (see Issue #8) and benchmark list row.
- On click: call \`benchmarkActionsApi.startBenchmark({ environmentId, benchmarkId })\`.
- While the API call is in flight: disable the button and show a spinner.
- On success: show a success toast (\"Benchmark started — a new run has been created\") and navigate to the run list page (Issue #10).
- On error: show an error toast with the API error message.

### 2. \"Stop Run\" button
- Location: active run row in the runs list (Issue #10) and run detail page (Issue #11).
- On click: show a confirmation dialog (\"Stop this run? It cannot be restarted.\").
- On confirm: call \`benchmarkActionsApi.stopBenchmarkRun({ environmentId, benchmarkId, runId })\`.
- On success: update the run's status to \"stopped\" in the UI and show a success toast.
- On error: show an error toast.

### 3. Polling / live status updates
- After starting a benchmark, the run list should poll \`benchmarkRunApi.listRuns({ environmentId, benchmarkId })\` every 5 seconds while any run is in a non-terminal state (i.e. not \`completed\` or \`stopped\`).
- Stop polling when all runs are in a terminal state.

### 4. Status badge component (\`src/components/ui/StatusBadge.tsx\`)
- Reusable badge that maps run status strings to a colour and icon:
  | Status | Colour | Icon |
  |---|---|---|
  | pending | grey | clock |
  | running | blue | spinner |
  | completed | green | checkmark |
  | stopped | orange | stop |
  | failed | red | exclamation |

### 5. Acceptance criteria
- Clicking Start on a benchmark creates a run and navigates to the runs list.
- The new run shows a \"running\" status badge.
- Clicking Stop on an in-progress run stops it and updates the badge.
- Live polling keeps the status current without a manual page reload.
" 2>&1)

echo "Issue 9 URL: $ISSUE_9"

# =============================================================================
# ISSUE 10 – Benchmark Runs List
# =============================================================================
ISSUE_10=$(gh issue create \
  --repo "$REPO" \
  --title "[RUNS] Benchmark Runs List and Environment-wide Runs Dashboard" \
  --label "P2 - High,Size: M,Area: Runs" \
  --body "## Summary
Two list views for runs: per-benchmark runs and a cross-benchmark environment dashboard. Users can monitor run status, navigate to run details, and delete runs.

---

## Importance
**P2 – High**

## Expected Size
**M (1-2 days)**

## Area
Runs

---

## Blocking / Blocked by
> **Blocked by:** Issue #8 (Benchmarks), Issue #9 (Start/Stop)
> **Blocks:** Issue #11 (Run Detail and Metrics)

---

## Actionable Tasks

### 1. Per-benchmark Runs List (\`src/pages/runs/BenchmarkRunsPage.tsx\`)
- Route: \`/environments/:environmentId/benchmarks/:benchmarkId/runs\`
- Fetch runs with \`benchmarkRunApi.listRuns({ environmentId, benchmarkId })\`.
- Table columns: Run ID (truncated), Status (badge from Issue #9), Start Time, Duration, Actions (View, Delete).
- Implement live polling (reuse from Issue #9) while any run is in a non-terminal state.

### 2. Environment-wide Runs Dashboard (\`src/pages/runs/EnvironmentRunsDashboardPage.tsx\`)
- Route: \`/environments/:environmentId/runs\`
- Fetch with \`benchmarkRunApi.listEnvironmentRuns({ environmentId })\`.
- Group or filter runs by benchmark name.
- Show summary statistics: total runs, pass/fail count, average duration.
- Pagination or infinite scroll for large lists.

### 3. Delete run flow
- Confirmation modal → \`benchmarkRunApi.deleteRun({ environmentId, benchmarkId, runId })\`.
- Remove from list optimistically on confirm.
- Restore and show error on failure.

### 4. Empty state
- If no runs exist yet: show an illustration + \"Start your first benchmark run\" CTA (links to the Start button from Issue #9).

### 5. Navigation from run row to run detail
- Clicking a run ID or \"View\" navigates to \`/environments/:environmentId/benchmarks/:benchmarkId/runs/:runId\`.

### 6. Add Runs sub-nav item
- Add \"Runs\" as a sub-navigation link under each benchmark and as a top-level item under each environment.

### 7. Acceptance criteria
- All runs for a benchmark are listed with correct status badges.
- The environment dashboard aggregates runs across all benchmarks.
- Runs update live without a manual refresh while they are in progress.
- Deleting a run removes it from both list views.
" 2>&1)

echo "Issue 10 URL: $ISSUE_10"

# =============================================================================
# ISSUE 11 – Run Detail View and Metrics Visualisation
# =============================================================================
ISSUE_11=$(gh issue create \
  --repo "$REPO" \
  --title "[ANALYTICS] Benchmark Run Detail View and Metrics Visualisation" \
  --label "P2 - High,Size: XL,Area: Runs,Area: Analytics" \
  --body "## Summary
The run detail page is the most data-rich view in the application. It shows raw data, derived aggregated metrics (percentiles, averages), resource usage, performance timing breakdowns, and VUS scaling graphs.

---

## Importance
**P2 – High** — This is the primary value-delivery page of the application.

## Expected Size
**XL (1-2 weeks)**

## Area
Runs / Analytics

---

## Blocking / Blocked by
> **Blocked by:** Issue #10 (Runs List)
> **Blocks:** None

---

## Actionable Tasks

### 1. Page scaffold (\`src/pages/runs/RunDetailPage.tsx\`)
- Route: \`/environments/:environmentId/benchmarks/:benchmarkId/runs/:runId\`
- Fetch run metadata with \`benchmarkRunApi.getRun({ environmentId, benchmarkId, runId })\`.
- Show a page-level status badge and run duration in the header.
- Divide the page into tabs: **Overview**, **Raw Data**, **Performance Metrics**, **Resource Metrics**.

### 2. Overview tab
- Run metadata: ID, status, start/end time, total duration.
- High-level KPI cards: total requests, error rate, average latency, peak RPS.
- Derived metrics from the API if available.

### 3. Raw Data tab
- Fetch with \`benchmarkRunApi.getRawData({ environmentId, benchmarkId, runId })\`.
- Render as a read-only, paginated data table (virtual scrolling recommended for large datasets).
- \"Download as CSV\" button that exports the raw data.

### 4. Performance Metrics tab
- Install charting library: \`npm install recharts\`
- Charts to build:
  - **Latency percentiles bar chart** (p50, p90, p95, p99, p99.9) — one bar per service.
  - **Requests-per-second over time** (line chart, x-axis = time, y-axis = RPS).
  - **Error rate over time** (area chart).
  - **HTTP timing breakdown** (stacked bar: DNS, TCP, TLS, TTFB, transfer).
- All charts should be responsive and have axis labels, tooltips, and a legend.

### 5. Resource Metrics tab
- Charts to build:
  - **CPU usage over time** — one line per host/service.
  - **Memory usage over time** — one line per host/service.
  - **Network I/O over time** — separate lines for in/out.
- A summary table at the bottom showing peak and average usage per host.

### 6. K6 VUS Metrics section (within Performance or separate tab)
- If VUS data is present: **Virtual Users over time** line chart.

### 7. Compare runs (stretch goal — mark as out-of-scope if too large)
- Side-by-side run comparison by selecting two runs from the runs list.

### 8. Acceptance criteria
- All tabs load without errors for a completed run.
- Charts render with correct data and are legible on all screen sizes.
- Raw data table handles > 10,000 rows without freezing (use virtual scrolling).
- Percentile values (p90, p95, p99, p99.9) are correctly labelled.
" 2>&1)

echo "Issue 11 URL: $ISSUE_11"

# =============================================================================
# ISSUE 12 – Messages and Notifications Centre
# =============================================================================
ISSUE_12=$(gh issue create \
  --repo "$REPO" \
  --title "[NOTIFICATIONS] Messages and Notifications Centre" \
  --label "P4 - Low,Size: S,Area: Notifications" \
  --body "## Summary
Display pending messages sent by agents to the current environment. This is a lower-priority feature that enhances observability but does not block core benchmarking workflows.

---

## Importance
**P4 – Low**

## Expected Size
**S (half a day)**

## Area
Notifications

---

## Blocking / Blocked by
> **Blocked by:** Issue #2 (Auth), Issue #3 (App Shell)
> **Blocks:** None

---

## Actionable Tasks

### 1. Notification bell icon in the header
- Add a bell icon button to the right side of the top header (see Issue #3 for placement).
- Show an unread badge count on the bell icon.

### 2. Notifications panel / dropdown (\`src/components/notifications/NotificationsPanel.tsx\`)
- Opens as a slide-out panel or dropdown when the bell icon is clicked.
- Fetch pending messages with \`agentApi.listMessages({ environmentId })\` for the currently active environment.
- Display: message text, timestamp, severity level (info / warning / error), source service name.
- Each message has a \"Mark as read\" / \"Dismiss\" button.
- \"Mark all as read\" button at the top of the panel.

### 3. Unread count polling
- Poll the messages endpoint every 30 seconds to keep the badge count current.
- Stop polling when the panel is open (as messages are being actively viewed).

### 4. Persistence
- Store dismissed message IDs in \`localStorage\` so that dismissed messages do not reappear on page reload.

### 5. Acceptance criteria
- The bell badge shows the correct number of unread messages.
- Opening the panel shows all pending messages for the current environment.
- Dismissing a message removes it from the panel and decrements the badge.
- Messages persist their dismissed state across page reloads.
" 2>&1)

echo "Issue 12 URL: $ISSUE_12"

echo ""
echo "==================================="
echo "All issues created successfully!"
echo "==================================="
