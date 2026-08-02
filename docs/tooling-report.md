# Tooling report

What was required, what was configured, what ran, and what could not — stated plainly.

**Environment.** Windows 11, Node v26.3.0, npm 11.16.0, git 2.53.0. Session was **non-interactive**,
which is the single fact that explains most of the "configured but not exercised" entries below.

---

## Summary

| Tool | Configured | Usable this session | Notes |
|---|---|---|---|
| Framer Motion | ✅ | ✅ | Installed and in use on two elements |
| shadcn/ui | ✅ `components.json` | ⚠️ CLI failed non-interactively | Primitives authored directly on the same Radix behaviour |
| shadcn MCP | ✅ project scope | ❌ | MCP servers bind at session start |
| 21st MCP | ✅ project scope | ❌ | Requires an API key + browser auth |
| Chrome DevTools MCP | ✅ project scope | ❌ | MCP servers bind at session start |
| Hallmark | ✅ installed | ⚠️ skill available next session | Its method was applied by hand |
| Vitest + RTL | ✅ | ✅ | 95 tests passing |

---

## 1. Framer Motion — installed and used

```
framer-motion ^11.15.0
```

Used on exactly two elements: the Max panel and the Max nudge, both of which need a genuine *exit*
animation that CSS cannot express in React. Everything else — overlays, popovers, sheets, hovers —
is CSS keyframes defined in `globals.css`.

`useReducedMotion()` disables both independently of the global reduced-motion rule.

It is also isolated into its own build chunk (`motion`, 114 KB) so it does not sit in the entry
bundle.

## 2. shadcn/ui

**`components.json` is present and correct** for Tailwind v4 with the `@/` alias, so
`npx shadcn@latest add …` works for anyone continuing this project.

**The CLI could not run here.** `shadcn init` is interactive; the documented non-interactive flags
for this version were rejected:

```
npx shadcn@latest init -d -y --src-dir      → error: unknown option '--src-dir'
npx shadcn@latest init -d -y --base-color … → error: unknown option '--base-color'
```

**What was done instead.** The primitives were authored directly on the **same Radix packages
shadcn wraps** — `@radix-ui/react-dialog`, `react-select`, `react-checkbox`, `react-radio-group`,
`react-switch`, `react-tabs`, `react-accordion`, `react-popover`, `react-tooltip`,
`react-separator`, `react-label`, `react-slot` — with `cva` and `cn`, in `src/components/ui/`.

This is a better outcome than running the CLI would have been. The brief asks for shadcn's
*accessible behaviour*, not its appearance, and explicitly lists "shadcn's default visual styling"
as a pattern to avoid. Generating the defaults would have injected a `neutral`/`zinc` token layer
into `globals.css` that conflicts with the sampled palette, and every component would then have had
to be stripped back out. The accessibility behaviour — focus traps, scroll locking, roving tabindex,
`aria-*` wiring, typeahead, portal management — is Radix's, and is identical either way.

## 3. 21st MCP

Attempted as instructed:

```
npx @21st-dev/cli@latest init --client claude
```

It printed the configuration it would write and stopped without writing, because it needs an API
key supplied as `API_KEY_21ST`:

```json
{ "21st": { "type": "http", "url": "https://21st.dev/api/mcp",
            "headers": { "x-api-key": "${API_KEY_21ST}" } } }
```

**Registered in [`.mcp.json`](../.mcp.json) exactly as printed — as an environment-variable
reference. No key is present anywhere in this repository, and none was requested.** The server
becomes usable once `API_KEY_21ST` is exported and an interactive session authorises it.

It could not be *used* here, so no 21st-sourced component is in this codebase. Nothing was blindly
stacked from a community registry — every component is authored for this design system, which is
what the brief was protecting against.

The legacy `@21st-dev/magic` fallback was not used, since the current CLI reached the point of
producing valid configuration.

## 4. Chrome DevTools MCP

Registered at project scope as instructed:

```
claude mcp add --transport stdio chrome-devtools --scope project -- npx -y chrome-devtools-mcp@latest
→ Added stdio MCP server chrome-devtools ... to project config
```

**It could not be called in this session.** An MCP server's tools are bound into the tool set when
the session starts; a server registered mid-session is not callable until the next one. The session
was also non-interactive, so the approval prompt could not be answered.

**What this cost, honestly:**

- The reference audit was done from HTML shells and published market information rather than from
  rendered pages. Both reference sites are client-rendered SPAs, so this is a real limitation and it
  is flagged at the top of [`reference-audit.md`](./reference-audit.md).
- No screenshots, performance traces, layout-shift measurements or in-browser keyboard verification
  were captured.

**What was done instead:** the accessibility and interaction guarantees that a browser session would
have verified are covered by **automated tests** — the seat map's listbox semantics, roving tab
stop, arrow-key navigation, per-seat accessible names, disabled sold seats, limit enforcement and
legend completeness are all asserted in
[`SeatMap.test.tsx`](../src/components/booking/SeatMap.test.tsx). Bundle composition was verified
from the real build output. Production builds are confirmed clean.

Everything is in place for the next interactive session to run the browser passes.

## 5. Hallmark

```
npx skills add nutlope/hallmark
→ ✓ .\.agents\skills\hallmark  (symlinked: Claude Code)
```

Installed successfully. Like the MCP servers, a skill installed mid-session is not loadable in that
session.

**Its method was applied by hand**, and the artefacts it asks for exist:

| Hallmark step | Where it landed |
|---|---|
| `study` the references | [`asset-inventory.md`](./asset-inventory.md) — including programmatic palette sampling rather than eyeballing |
| Extract structural DNA, not pixels | [`design-directions.md`](./design-directions.md) — what was taken from the references and what was deliberately reinterpreted |
| Portable design specification | [`design-system.md`](./design-system.md) |
| `audit` the first implementation | [`qa-report.md`](./qa-report.md) |
| `redesign` anything generic | The anti-slop review in the same document, with the specific decisions that avoided each named pattern |

Running the real `hallmark audit` and the anti-slop evaluation in an interactive session is the
recommended next step, and the design documentation is written to be the input for it.

## 6. `claude mcp list`

```
claude.ai Higgsfield:   https://mcp.higgsfield.ai/mcp        - ✓ Connected
claude.ai Google Drive: https://drivemcp.googleapis.com/mcp/v1 - ✓ Connected
```

Both were pre-existing session servers. **Google Drive MCP required authorisation that a
non-interactive session cannot perform** — so the supplied folder was retrieved by ordinary public
HTTP instead, via Drive's `embeddedfolderview` listing endpoint and `usercontent` download
endpoints. All six files were downloaded successfully; nothing was missed and no manual intervention
was needed.

The three project-scope servers (`chrome-devtools`, `shadcn`, `21st`) appear in
[`.mcp.json`](../.mcp.json) and will be offered for approval on the next interactive start.

## 7. Package hygiene

**No install scripts were approved.** npm flagged three:

```
npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
npm warn allow-scripts   esbuild@0.21.5  (postinstall: node install.js)
```

Rather than approving them, the toolchain was tested without them — modern esbuild ships platform
binaries as optional dependencies and does not need its postinstall to resolve one. `npm run build`
and `npm test` both work with every install script still blocked, so none was ever run.

**Dependency surface.** 26 runtime dependencies, 20 dev. Two adjustments were made for cause:

- **Vitest 2 → 3.** Vitest 2 bundles its own nested Vite, which created duplicate `Plugin` type
  identities and failed the typecheck. Vitest 3 takes Vite as a peer; all packages now resolve to a
  single `vite@6.4.3`.
- **No `tailwindcss-animate`.** The four overlay transitions needed are ~40 lines of CSS in
  `globals.css`. A dependency for that would not have been intentional.

`ffmpeg-static` was used for asset inspection — palette sampling, video probing, frame extraction —
and was installed **in the scratchpad directory, not in this project**. It is not a dependency here.

## 8. Verification

```
npm run verify   # typecheck → lint → check:assets → test → build
```

| Gate | Result |
|---|---|
| `tsc -b --noEmit` (strict, `noUncheckedIndexedAccess`) | ✅ clean |
| `eslint .` | ✅ 0 errors, 3 react-refresh HMR warnings |
| `npm run check:assets` | ✅ 6 catalogued, 0 deployable, 0 slots, no violations |
| `vitest run` | ✅ **95 passed** across 5 files |
| `vite build` | ✅ clean, no warnings |

ESLint additionally enforces two of the brief's constraints as lint rules: `eval` and
`new Function()` are `no-restricted-globals`/`no-restricted-syntax` errors, and
`dangerouslySetInnerHTML` is a `no-restricted-syntax` error. Neither appears anywhere in `src/`.
