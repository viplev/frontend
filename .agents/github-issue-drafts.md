# GitHub Issue Drafts (Actionable Backlog)

Use these as copy/paste starting points.  
Default labels per issue:
- `ready:no`
- one `domain:*`
- one `type:*`

---

## Prioritization and Blocking Map

### Phase 1 (Foundation / must-have first)
- #1 Login screen with JWT session bootstrap
- #2 Bearer token wiring for OpenAPI client
- #3 Route guard + logout flow
- #14 App shell layout
- #4 Environments list view
- #23 Persistent top-bar "Create Environment" CTA
- #24 Easy access to "All Active Runs" view

### Phase 2 (Core product workflows)
- #5 Create environment form
- #6 Environment details with services overview
- #7 Benchmark list per environment
- #8 Benchmark create/edit flow
- #9 Start benchmark run
- #10 Live run monitor
- #11 Stop benchmark run
- #13 Run history view with filters
- #18 Agent message/status inbox view

### Phase 3 (Insights, quality, UX polish)
- #12 Run results summary view
- #21 Interactive charts for run analysis
- #22 Light/dark theme with explicit user toggle
- #15 Standard async state components
- #17 Auth failure interceptor and recovery UX
- #19 Prevent stale authenticated UI on logout
- #20 Domain service layer for benchmark/run operations
- #16 Issue readiness checklist + labeling policy docs

### Blocking dependencies (suggested)
- #2 blocked by #1
- #3 blocked by #1, #2
- #4 blocked by #1, #2
- #23 blocked by #14
- #5 blocked by #1, #2, #14
- #6 blocked by #4
- #7 blocked by #4
- #8 blocked by #7
- #9 blocked by #7, #8
- #10 blocked by #9
- #11 blocked by #10
- #12 blocked by #10
- #13 blocked by #7
- #18 blocked by #4
- #24 blocked by #9, #10
- #21 blocked by #12
- #19 blocked by #3

---

## 1) [Feature][Auth] Login screen with JWT session bootstrap
**Labels:** `domain:auth`, `domain:ui`, `type:feature`, `ready:no`

**Context / Problem**  
No authentication UX exists yet, but backend requires username/password login and returns JWT for protected calls.

**User Story (Connextra)**  
As a platform user, I want to sign in with username/password, so that I can access protected VIPLEV features.

**Scope**  
In: login form, submit flow, auth error feedback, in-memory + persisted token state.  
Out: role/permission matrix.

**Acceptance Criteria (G/W/T)**  
- Given valid credentials, when user submits login, then JWT is stored and authenticated state is set.  
- Given invalid credentials, when user submits login, then clear error feedback is shown.  
- Given authenticated user refreshes app, when app rehydrates, then session remains authenticated if token exists.

**Validation**  
`npm run lint`  
`npm run build`

---

## 2) [Feature][Auth] Centralized bearer token wiring for OpenAPI client
**Labels:** `domain:auth`, `type:feature`, `ready:no`

**Context / Problem**  
Generated API client exists, but token injection path must be explicitly wired for authenticated endpoints.

**Scope**  
In: single API client config module; bearer token attached from auth state.  
Out: replacing generated SDK.

**Acceptance Criteria (G/W/T)**  
- Given authenticated state, when protected endpoint is called, then request includes `Authorization: Bearer <token>`.  
- Given no token, when protected endpoint is called, then 401 is surfaced to caller/UI (not swallowed).  
- Given login/logout changes token, when next request is sent, then latest token value is used.

**Validation**  
`npm run lint`  
`npm run build`

---

## 3) [Feature][Auth] Route guard + logout flow
**Labels:** `domain:auth`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As an authenticated user, I want protected views to require login and to be able to logout, so that session access is secure and controllable.

**Scope**  
In: protected route wrapper, redirect-to-login, logout action clears session.  
Out: token refresh flow.

**Acceptance Criteria (G/W/T)**  
- Given unauthenticated user, when opening protected route, then user is redirected to login.  
- Given authenticated user, when opening protected route, then view loads normally.  
- Given authenticated user, when logout is clicked, then token/session state is cleared and user is redirected.

**Validation**  
`npm run lint`  
`npm run build`

---

## 4) [Feature][Environment] Environments list view
**Labels:** `domain:environment`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want to see all environments, so that I can pick where to manage benchmarks and runs.

**Scope**  
In: fetch/render `listEnvironments`, loading/empty/error states.
Out: create/edit/delete.

**Acceptance Criteria (G/W/T)**  
- Given authenticated user, when environments view opens, then environment list is loaded and displayed.  
- Given no environments, when list returns empty, then dedicated empty state is shown.  
- Given API failure, when load fails, then user sees explicit retryable error state.

---

## 5) [Feature][Environment] Create environment form
**Labels:** `domain:environment`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want to create an environment, so that agents can register and benchmarking can begin.

**Scope**  
In: form UI, client validation, `createEnvironment` submit, success redirect.  
Out: bulk import.

**Acceptance Criteria (G/W/T)**  
- Given valid form data, when submit is clicked, then environment is created and appears in list.  
- Given valid form data, when the API returns the agent token, then a pre-configured command i shown for installing the agent into the system 
- Given invalid input, when submit is attempted, then validation messages are shown near fields.  
- Given API error, when create fails, then user sees clear failure message.

---

## 6) [Feature][Environment] Environment details with services overview
**Labels:** `domain:environment`, `domain:ui`, `type:feature`, `ready:no`

**Scope**  
In: `getEnvironment`, `listServices`, details layout with readiness signals. Periotic automatic updates to ensure acurate information is presented to the user.    
Out: live streaming updates.

**Acceptance Criteria (G/W/T)**  
- Given valid environment id, when details opens, then environment metadata is shown.  
- Given registered services, when details loads, then services list is visible.  
- Given unknown environment id, when request returns 404, then not-found state is shown.

---

## 7) [Feature][Benchmark] Benchmark list per environment
**Labels:** `domain:benchmark`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want to see all benchmarks for an environment, so that I can select, edit, or run a scenario.

**Scope**  
In: `listBenchmarks`, benchmark cards/table, loading/error/empty states. Periotic automatic updates to ensure acurate information is presented to the user.    
Out: benchmark editing.

**Acceptance Criteria (G/W/T)**  
- Given selected environment, when benchmark view opens, then benchmarks are listed.  
- Given benchmark view opens, when a benchmark is activly running, then it should be highlighted in the UI.  
- Given benchmark view opens and there are runnable benchmarks, then there should be a start action for the benchmark.  
- Given a benchmark is actively running on the relevant enviornment, then the start action should be inactive.
- Given none exist, when list is empty, then empty state prompts benchmark creation.  
- Given API error, when loading fails, then explicit error state appears.

---

## 8) [Feature][Benchmark] Benchmark create/edit flow
**Labels:** `domain:benchmark`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want to create and update benchmark definitions, so that I can run test scenarios aligned with my goals.

**Scope**  
In: `createBenchmark`, `updateBenchmark`, form for name/description/k6 instructions.  
Out: advanced K6 linting.

**Acceptance Criteria (G/W/T)**  
- Given valid benchmark data, when save is submitted, then benchmark persists successfully.  
- Given invalid data, when save is attempted, then validation feedback is shown.  
- Given edit mode, when user updates and saves, then benchmark list/details reflect changes.

---

## 9) [Feature][Benchmark] Start benchmark run from benchmark details
**Labels:** `domain:benchmark`, `domain:metrics`, `type:feature`, `ready:no`

**Scope**  
In: `startBenchmark` action, status feedback, run id handoff to monitor view.  
Out: scheduling future runs.

**Acceptance Criteria (G/W/T)**  
- Given runnable benchmark, when user clicks start, then start API is called and run is created.  
- Given successful start, when response returns run metadata, then UI navigates to run monitor context.  
- Given start failure, when API rejects, then user sees actionable failure feedback.  
- Given a benchmark is actively running on the relevant enviornment, then the start action should be inactive and a "go to active run" should be shown

---

## 10) [Feature][Metrics] Live run monitor screen
**Labels:** `domain:metrics`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want a live monitor during a run, so that I can observe status and decide whether to stop early.

**Scope**  
In: `getBenchmarkRun` polling, core run status panel, stop action entry point. Live updating charts of metrics.

**Acceptance Criteria (G/W/T)**  
- Given active run, when monitor opens, then current run status is visible and refreshes periodically.  
- Given run transitions state, when backend status changes, then UI reflects latest status without reload.  
- Given failed status retrieval, when poll fails, then monitor shows non-silent error state.

---

## 11) [Feature][Benchmark] Stop benchmark run action
**Labels:** `domain:benchmark`, `type:feature`, `ready:no`

**Scope**  
In: `stopBenchmarkRun` trigger + confirmation UX.  
Out: force-delete run records.

**Acceptance Criteria (G/W/T)**  
- Given active run, when user confirms stop, then stop API is called with correct ids.  
- Given stop accepted, when backend marks pending/stop, then monitor status updates accordingly.  
- Given stop fails, when API errors, then user sees failure state.

---

## 12) [Feature][Metrics] Run results summary view (derived + raw hooks)
**Labels:** `domain:metrics`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want to view run results summaries, so that I can interpret performance and resource impact.

**Scope**  
In: use `getBenchmarkRun`, `getBenchmarkRunRaw`; render key summary sections for HTTP/resource/VUs.  
Out: cross-run comparison.

**Acceptance Criteria (G/W/T)**  
- Given completed run, when results view opens, then summary data sections are shown.  
- Given raw payload available, when user expands details, then raw metrics are accessible.  
- Given incomplete data, when some sections missing, then UI degrades gracefully with explicit placeholders.

---

## 13) [Feature][Metrics] Run history view with filters
**Labels:** `domain:metrics`, `domain:ui`, `type:feature`, `ready:no`

**Scope**  
In: `listEnvironmentRuns` + `listBenchmarkRuns`, filters by status/time/benchmark.  
Out: server-side pagination redesign.

**Acceptance Criteria (G/W/T)**  
- Given environment selected, when history opens, then runs list is visible.  
- Given filter changes, when user applies filters, then list updates to matching results.  
- Given no matches, when filtered set is empty, then empty-result state is shown.

---

## 14) [Refactor][UI] App shell layout with persistent navigation and context
**Labels:** `domain:ui`, `type:refactor`, `ready:no`

**Context / Problem**  
Current `App.tsx` is starter scaffold; no shell for multi-view product workflows.

**Scope**  
In: app shell (sidebar/topbar/content), global error banner region, breadcrumb/context slot.  
Out: pixel-perfect final design.

**Acceptance Criteria (G/W/T)**  
- Given authenticated user, when app loads, then navigation shell is consistently visible across product views.  
- Given environment/benchmark context selected, when user navigates, then context remains visible.  
- Given global API/auth errors, when they occur, then shell shows clear global alert area.

---

## 15) [Feature][UI] Standard async state components (loading/empty/error)
**Labels:** `domain:ui`, `type:feature`, `ready:no`

**Scope**  
In: reusable components/patterns for async states to reduce inconsistent UX.  
Out: full design system.

**Acceptance Criteria (G/W/T)**  
- Given any API-backed screen, when request is pending, then standardized loading UI is shown.  
- Given empty response, when data array is empty, then standardized empty state is shown.  
- Given request failure, when API errors, then standardized error + retry affordance is shown.

---

## 16) [Docs][Process] Define issue readiness checklist and labeling policy in repo
**Labels:** `domain:ui`, `type:docs`, `ready:no`

**Scope**  
In: document `ready:no -> ready:yes` gate + mandatory labels and expected issue sections.  
Out: CI automation for issue templates.

**Acceptance Criteria (G/W/T)**  
- Given contributor creates issue, when following policy, then issue contains required sections and labels.  
- Given issue is ambiguous, when checklist is applied, then blockers are explicit before implementation starts.  
- Given issue is implementation-ready, when checklist passes, then it is marked `ready:yes`.

---

## 17) [Feature][Auth] Auth failure interceptor and recovery UX
**Labels:** `domain:auth`, `domain:ui`, `type:feature`, `ready:no`

**Scope**  
In: centralized handling for 401/403, auto-logout on invalid token, redirect with return-path.  
Out: refresh-token silent renew.

**Acceptance Criteria (G/W/T)**  
- Given token expires/invalid, when API returns 401, then session is invalidated and user redirected to login.  
- Given redirect to login from protected view, when login succeeds, then user is returned to prior target route.  
- Given repeated unauthorized calls, when interceptor handles them, then user sees one clear message (no toast storm).

---

## 18) [Feature][Environment] Agent message/status inbox view
**Labels:** `domain:environment`, `domain:metrics`, `type:feature`, `ready:no`

**Scope**  
In: `listMessages` integration for environment-level agent/system messages.  
Out: real-time websockets.

**Acceptance Criteria (G/W/T)**  
- Given environment context, when messages view opens, then latest messages are listed.  
- Given message types/statuses differ, when rendered, then UI clearly distinguishes severity/type.  
- Given fetch failure, when request fails, then user sees explicit error state.

---

## 19) [Bug][Auth] Prevent accidental access to stale authenticated UI on logout
**Labels:** `domain:auth`, `type:bug`, `ready:no`

**Context / Problem**  
Common SPA bug risk: stale view remains visible after logout until navigation.

**Scope**  
In: immediate protected-state teardown and route transition on logout.  
Out: browser hard-refresh requirements.

**Acceptance Criteria (G/W/T)**  
- Given user logs out, when action completes, then protected data is cleared from visible UI immediately.  
- Given browser back navigation after logout, when user attempts to revisit protected route, then auth guard blocks access.  
- Given cached query/state exists, when logout occurs, then sensitive caches are reset.

---

## 20) [Refactor][Benchmark] Domain service layer for benchmark/run operations
**Labels:** `domain:benchmark`, `type:refactor`, `ready:no`

**Scope**  
In: wrap generated SDK calls in typed domain service functions for benchmarks/runs.  
Out: introducing new backend API contract.

**Acceptance Criteria (G/W/T)**  
- Given benchmark/run UI needs data, when it calls domain service, then service abstracts SDK details consistently.  
- Given endpoint or DTO shape changes, when service adapts, then call sites require minimal churn.  
- Given API errors, when propagated through service, then UI receives typed actionable error objects.

---

## 21) [Feature][Metrics] Interactive charts for run analysis (hover, zoom, axis resize)
**Labels:** `domain:metrics`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user analyzing benchmark outcomes, I want interactive charts, so that I can inspect trends and anomalies precisely.

**Scope**  
In: chart interactions for highlighting/tooltip, zoom in/out, and axis-resize controls on results views.  
Out: custom chart engine implementation from scratch.

**Acceptance Criteria (G/W/T)**  
- Given run results with timeseries data, when user hovers chart regions, then relevant series/points are highlighted with readable values.  
- Given dense chart data, when user zooms into a range, then chart rescales and focuses on selected interval.  
- Given changing data ranges, when user adjusts axis scale/resize controls, then axes update without data loss or rendering glitches.

**Validation**  
`npm run lint`  
`npm run build`

---

## 22) [Feature][UI] Light/dark theme with explicit user toggle
**Labels:** `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user, I want to switch between light and dark mode, so that I can use the interface comfortably in different environments.

**Scope**  
In: global theme state, toggle control, persisted preference, app-wide themed tokens.  
Out: per-page custom themes.

**Acceptance Criteria (G/W/T)**  
- Given user is in app shell, when theme toggle is changed, then UI switches between light and dark mode immediately.  
- Given user has selected a theme, when app reloads, then prior theme preference is restored.  
- Given key pages (auth, environments, benchmarks, results), when rendered in either theme, then contrast/readability remain acceptable.

**Validation**  
`npm run lint`  
`npm run build`

---

## 23) [Feature][Environment] Persistent top-bar "Create Environment" CTA
**Labels:** `domain:environment`, `domain:ui`, `type:feature`, `ready:no`

**Context / Problem**  
Environment onboarding is a critical action and should remain highly visible at all times.

**Scope**  
In: static, high-visibility top-bar button to open create environment flow from anywhere in authenticated shell.  
Out: multiple competing CTAs in same prominence tier.

**Acceptance Criteria (G/W/T)**  
- Given authenticated user in any primary app view, when top bar is visible, then "Create Environment" CTA is clearly visible.  
- Given user clicks CTA, when action triggers, then user navigates directly to environment creation flow.  
- Given create flow is unavailable (rare), when CTA is clicked, then user gets explicit and actionable feedback.

---

## 24) [Feature][Metrics] Easy access to "All Active Runs" view
**Labels:** `domain:metrics`, `domain:ui`, `type:feature`, `ready:no`

**User Story (Connextra)**  
As a user operating the platform, I want one-click access to all active runs, so that I can monitor ongoing activity quickly.

**Scope**  
In: prominent navigation entry to global active-runs page and aggregated active run list.  
Out: deep analytics on completed runs.

**Acceptance Criteria (G/W/T)**  
- Given authenticated user in app shell, when looking at primary navigation, then "All Active Runs" is easy to discover and access.  
- Given active runs exist across environments/benchmarks, when page opens, then all active runs are listed with key status fields.  
- Given no active runs, when page opens, then user sees a clear empty state with path to start a run.

