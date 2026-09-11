# Specification: Startup company website

**Status:** Proposed design for human review; not approved for production implementation.  
**Intent:** `intent.md`.  
**Basis:** The website-planning conversation and the technical references below.

## 1. Authority and decision status

This document translates `intent.md` into a proposed requirements and design baseline. The confirmed constraints are GitHub, GitHub Actions deployment to Cloudflare, and pnpm. Astro and the other technical choices below are recommendations, not additional claims about the originator's original intent.

Within this draft, **must** identifies a proposed acceptance requirement that becomes binding when the specification is approved. **Optional** features are not authorization to implement them. Changes to the business outcome or confirmed constraints require an intent revision; implementation decisions belong here.

No company-specific brand, security, compliance, or UX policies were supplied. Apply any such policies when available and flag conflicts instead of claiming conformity. Keep unresolved questions visible. Human acceptance of the intent and specification precedes implementation planning, following the referenced playbook.[^playbook-intent][^playbook-design]

## 2. Proposed scope

**Working assumption:** This is a public, informational company/marketing website, not the startup's customer-facing software application. The initial editing workflow is developer/AI-operated through GitHub; nontechnical editing requirements remain open.

Provide a shared page layout, navigation, footer, responsive styling, an approved homepage, and a useful not-found page. Company information, an explanation of the offering, and an approved next action can be homepage sections or separate pages; the final page inventory depends on Q-01 and Q-02.

Do not create a blog, case-study library, pricing page, CMS, contact-form backend, analytics integration, or elaborate animation solely because it appeared as an example in the conversation. Add each only against an approved requirement. Do not invent customers, testimonials, prices, claims, contact details, or legal text.

Authentication, payments, dashboards, databases, native apps, and offline/PWA functionality are outside the proposed baseline. Reconsider the architecture when a real requirement calls for them.

## 3. Architecture and tool decisions

| ID | Area | Proposed decision and rationale |
| --- | --- | --- |
| D-01 | Website framework | Astro, with pages generated at build time. Keep the initial site a static, multi-page website rather than a client-rendered application. |
| D-02 | Package manager | pnpm, as explicitly selected in C-03. Commit `pnpm-lock.yaml`; do not maintain competing package-manager lockfiles. |
| D-03 | Tooling runtime | A supported Node.js LTS version compatible with the chosen Astro and Wrangler releases. Node runs development/build tools, not a production application server. |
| D-04 | Language | TypeScript with strict checking, including Astro components. Run explicit type checks separately from the build.[^astro-typescript] |
| D-05 | Styling | Tailwind CSS through its first-party Vite integration, with shared design tokens and ordinary CSS where clearer.[^tailwind] |
| D-06 | Components | Astro components first; browser-native HTML/CSS and small TypeScript enhancements for interaction. Do not install React, Svelte, or Vue by default. |
| D-07 | Content | Markdown for long-form content, schema-validated Astro Content Collections for repeated content types, and YAML/JSON for structured copy where useful.[^astro-content] |
| D-08 | Formatting and linting | Prettier with `prettier-plugin-astro` for formatting; Biome for standalone JavaScript/TypeScript linting, with its formatter disabled. Keep `.astro` files outside Biome's baseline scope while its support is experimental.[^astro-editor] |
| D-09 | Testing | Playwright for browser behavior and responsive checks; `@axe-core/playwright` for automated accessibility checks. Add a unit-test runner only when standalone logic warrants it.[^playwright-a11y] |
| D-10 | Hosting | Cloudflare Workers Static Assets, serving the generated `dist/` directory. No custom Worker script or Astro Cloudflare adapter is needed for the static baseline.[^astro-cloudflare][^cloudflare-assets] |
| D-11 | Deployment | Repository-installed Wrangler, invoked by GitHub Actions. GitHub Actions remains the deployment authority; do not also enable a competing automatic Cloudflare build/deploy workflow.[^cloudflare-actions] |

Select mutually compatible stable releases at project setup, then record and pin the resolved Node and pnpm versions and commit the dependency lockfile. Do not copy speculative version numbers from the conversation or resolve `latest` on each CI run. Set and commit the Wrangler compatibility date deliberately.

### Delivery model

```text
GitHub repository
  Astro components + Markdown/data + assets + tests + configuration
          |
          v
GitHub Actions: install -> validate -> build -> browser tests
          |
          v
Tested static build from the approved production commit
          |
          v
Wrangler -> Cloudflare Workers Static Assets -> visitor's browser
```

The published site does not require a running Node server, database, CMS service, or request-time rendering. Build-time dependencies are not automatically shipped to visitors. Request-time functionality is an explicit extension, not a prerequisite for Cloudflare hosting.[^astro-cloudflare][^cloudflare-assets]

## 4. Content and presentation design

Keep presentation in reusable `.astro` components and layouts. Keep substantial editable copy separate from layout code where that improves clarity. Markdown is for prose, not a compulsory language for constructing complex homepage layouts.

For each content type actually required, define an explicit schema in `src/content.config.ts`. Use build-time loaders and validate necessary metadata, such as title, description, publication state, and image references. Only require dates, authors, or customer fields when the content type needs them. Astro collections support schema validation and generated TypeScript types.[^astro-content]

A content-only change must not require editing a layout component. Invalid required metadata must fail validation/build. Generated routes must be unique. Where drafts exist, exclude them from production routes, listings, feeds, and sitemaps; do not rely on merely hiding their navigation links.

Do not enable MDX initially. Add it only for a demonstrated need for components inside prose, and treat it as trusted executable source. Repository content is for approved public material, not private customer records or secrets.

A possible repository shape is:

```text
intent.md
spec.md
README.md
package.json
pnpm-lock.yaml
astro.config.mjs
wrangler.jsonc
tsconfig.json
src/
  pages/              # Approved routes, including index.astro and 404.astro
  layouts/            # Shared document and page layouts
  components/         # Reusable UI sections
  content/            # Only the content collections actually needed
  content.config.ts   # Add when collections are introduced
  data/               # Structured copy or navigation data, when useful
  styles/             # Global styles and design tokens
  assets/             # Images processed during the build
public/               # Files copied without build-time transformation
tests/
  e2e/
.github/
  workflows/
```

Do not create empty abstractions or example collections just to populate this structure.

A Git-based CMS remains an optional extension for a confirmed editor need. Its integration must preserve content schemas, access controls, review rules, and the existing deployment path. A browser content editor is not assumed to provide arbitrary visual page redesign.

## 5. Visitor-facing requirements

### R-01 — Approved content and navigation

Publish only approved pages and factual content. Provide consistent navigation, meaningful link text, a clear page hierarchy, and the business-approved next action. All internal links and assets must resolve. Unknown URLs must return a real HTTP 404 with the not-found page, not the homepage with a 200 response.

Configure Workers Static Assets to use the generated 404 page. This is a multi-page site, not a single-page application fallback.[^cloudflare-assets]

### R-02 — Mobile-first behavior

Provide responsive layouts from **320 CSS pixels** upward. Test representative widths of **320, 390, 768, and 1440 CSS pixels**; these are proposed test sizes, not phone-model guarantees.

There must be no unintended page-level horizontal scrolling, clipped content, overlapping controls, or inaccessible navigation. Deliberately scrollable tables/code blocks may scroll inside their own containers. Text resizing must not hide content or actions. Include the viewport metadata needed for responsive behavior.

Use appropriately sized images with reserved dimensions, readable typography, and mobile navigation that supports touch and keyboard use. Do not depend on hover. Aim for **44 × 44 CSS-pixel** primary buttons and navigation controls as a project usability target, not a claim about the universal WCAG minimum.

### R-03 — Accessibility

Use **WCAG 2.2 AA** as the proposed accessibility target, subject to any supplied company policy. Use semantic HTML, labeled inputs, useful alternative text, sufficient contrast, visible keyboard focus, logical headings, and reduced-motion behavior. Avoid unnecessary custom widgets.[^wcag]

Automated checks must be supplemented by manual keyboard, zoom, and assistive-technology review of the main visitor journey. Passing automated checks does not establish complete accessibility conformance.[^playwright-a11y]

### R-04 — Performance and progressive enhancement

Core content and navigation must remain usable without client-side JavaScript. Add JavaScript only for an identified behavior, and keep it local to the relevant component. Do not introduce site-wide hydration or an animation library without a documented benefit.

Prefer build-time image optimization and responsive image selection. Do not lazy-load the principal above-the-fold image; lazy-load appropriate below-the-fold media. Avoid unnecessary fonts, scripts, and third-party embeds.

Record a Lighthouse mobile report for representative built pages before launch and after substantial UI changes. Treat the report as diagnostic evidence, not a substitute for browser testing or a promise of real-user performance. Set numerical performance budgets after the actual design and content are approved rather than inventing a business requirement now.

### R-05 — Search and sharing metadata

Each indexable page must have an appropriate title, description, canonical URL, and sharing metadata. Generate a sitemap for approved public routes and configure robots directives intentionally. Use a consistent URL policy. Never populate structured data with invented company facts.

Production domain configuration remains a launch prerequisite. Shared previews must be non-indexable; confidential previews also require access control. Search-engine exclusion is not an access-control mechanism.

### R-06 — Contact and other integrations

Implement only the approved next action: a contact link, booking link, form, or another explicitly chosen destination. A static page must not pretend to submit or store an inquiry.

When a form is approved, extend this specification with its recipient, provider or endpoint, required fields, validation, abuse protection, delivery/error behavior, and data-handling requirements. Keep credentials server-side. Add a narrow backend capability only when needed; do not convert every page to request-time rendering for one form.

Analytics, tracking, and other paid or data-collecting integrations require a separate decision about purpose, cost, and applicable company policy.

## 6. Development and delivery requirements

### R-07 — Reproducible local workflow

Document installation and the following project script contracts in `README.md`:

| Command | Required behavior |
| --- | --- |
| `pnpm install --frozen-lockfile` | Install without changing the committed dependency resolution; fail on manifest/lockfile mismatch.[^pnpm-install] |
| `pnpm dev` | Start local Astro development. |
| `pnpm check` | Check Astro and TypeScript source; include relevant tests and configuration in type-check coverage. |
| `pnpm lint` | Run configured lint checks without changing files. |
| `pnpm format:check` | Check formatting without changing files. |
| `pnpm build` | Generate deployable static output and validate build-time content. |
| `pnpm preview:cloudflare` | Serve an existing build with local Wrangler for production-like routing checks. |
| `pnpm test:e2e` | Run browser tests against the built site. |

These are contracts for the implementation, not a claim that scripts already exist. Keep formatter ownership unambiguous. Astro's build is not a replacement for explicit type checking.[^astro-typescript]

### R-08 — CI and production deployment

Pull requests must run a frozen install, formatting checks, linting, type/content checks, a production build, and browser tests against that build. Test the built files through local Wrangler rather than relying only on Astro's development server.

The approved production-branch commit must pass validation before deployment. Deploy the same build artifact that passed its checks, record its commit identifier, and run a post-deployment smoke test. A failed check must not publish a new production version.

Use a scoped Cloudflare API token stored as a GitHub secret, never committed source. Use least-privilege workflow permissions and pin third-party Actions to reviewed commit SHAs. Do not expose deployment credentials to untrusted pull-request code. Review dependency install-script permissions rather than approving every script by default.[^cloudflare-actions]

Protect the production branch and environment using controls supported by the company's GitHub plan. Serialize production deployments so an older job cannot overwrite a newer release. Keep ordinary deployment in GitHub Actions, as required by C-02.

**Current setup decision (2026-09-12):** The originator chose a public GitHub
repository to obtain enforced branch protection without a paid upgrade. Protect
`main` with required pull requests, up-to-date status checks from GitHub Actions,
administrator enforcement, and disabled force pushes/deletion. Initially require
`Setup validation`; add the site validation checks when that workflow exists.
Required checks must run on every PR, including documentation-only changes.
Continue to validate deployment-branch pushes, make deployment depend on successful
validation, isolate deployment secrets, and serialize writes to each Worker.
Configure the production environment when the production workflow is approved.
Source, history and Actions logs are public; a later visibility change requires
review of the resulting protection changes. No paid plan is authorized.

Shared preview deployments are optional until an editor/reviewer needs them; local Wrangler preview is part of the baseline. Any shared preview path needs explicit access and indexing rules.

### R-09 — Recovery and ownership

Document the production account, domain configuration, secret names, deployment process, and content-editing workflow without recording secret values. Assign a maintenance owner before launch.

Document and rehearse restoration of a known-good approved version through the deployment workflow, then verify the restored site. Explain how dependency updates are proposed and checked. Paid subscriptions or additional services require explicit approval; no zero-cost budget has been specified.

Cloudflare currently documents static-asset requests as free, but that is not a guarantee of zero total website cost. Domain registration, CI usage, additional services, and future dynamic behavior need their own cost assessment.[^cloudflare-billing]

## 7. Acceptance and verification

The following checks are proposed release criteria, not evidence that the website has already been implemented or tested.

| Check | Acceptance evidence | Traceability |
| --- | --- | --- |
| A-01 | The startup approves the actual page inventory, content, design, and primary visitor action; no placeholders are published. | I-01; Q-01–Q-03 |
| A-02 | The GitHub repository includes the pinned tooling configuration, pnpm lockfile, source, tests, and documented local commands; a fresh checkout passes the workflow. | C-01, C-03; R-07 |
| A-03 | A validated approved commit is deployed by GitHub Actions to Cloudflare; deliberately failing a required check prevents deployment. | C-02; R-08 |
| A-04 | Approved pages and links work; an unknown route returns the custom page with HTTP 404; drafts are absent from all production outputs where applicable. | R-01; content design |
| A-05 | Playwright checks at the specified widths detect overflow and verify navigation and the approved visitor action. Review core flows in Chromium, Firefox, and WebKit. | I-03; R-02 |
| A-06 | Manual checks on real mobile Safari and Chrome confirm the main journey, touch behavior, and layout before launch. Emulated devices supplement rather than replace this check.[^playwright-emulation] | I-03; R-02 |
| A-07 | Automated accessibility checks report no unresolved serious/critical violations; manual review records keyboard, zoom, focus, contrast, and screen-reader findings. Remaining issues require explicit disposition against the accessibility target. | R-03 |
| A-08 | Core content/navigation work with JavaScript disabled; responsive media and the mobile performance report have been reviewed. | R-04 |
| A-09 | Production metadata uses the approved domain; public routes are correctly indexable and previews are not. | R-05 |
| A-10 | Any approved form/integration has tested success and failure paths and an approved data-handling design; otherwise it is absent. | R-06 |
| A-11 | The originator can inspect design decisions, reproduce the workflow, and identify who maintains and can restore the site. Recovery has been rehearsed. | I-02; R-09 |

Retain browser failure traces/screenshots and relevant CI results. Visual review is still required for brand quality, composition, and copy; passing tests does not approve the design. Playwright supports device emulation, and its accessibility guidance explicitly recommends combining automation with manual assessment.[^playwright-emulation][^playwright-a11y]

## 8. Open decisions and concerns

| Intent question | Current treatment and required resolution |
| --- | --- |
| Q-01 — Business | Unresolved. Approve company identity, audience, messaging, and the primary action before final content/design acceptance. |
| Q-02 — Scope | Unresolved. Confirm pages and features before adding optional collections, integrations, or backend services. |
| Q-03 — Design and content | Unresolved. Supply brand material, approved copy/assets, and an approver. Do not treat an AI-generated mock-up as brand approval. |
| Q-04 — Ownership | Developer/AI editing through GitHub is only a working assumption. Confirm editor needs before approving the architecture. Frequent independent visual redesign could justify reopening the Framer comparison; simple content editing may justify a Git-based CMS. |
| Q-05 — Delivery | Unresolved. Confirm company-controlled accounts, domain, permissions, production approver, and recovery access before connecting production. |
| Q-06 — Commercial constraints | Unresolved. No deadline, traffic estimate, or spending ceiling is inferred. Review lifecycle effort and handoff costs, not hosting fees alone. |
| Q-07 — Policies | No company policies supplied. Obtain the applicable policies before approving data collection, third-party tracking, legal pages, or a claim of compliance. |

These gaps do not prevent reviewing the proposed technical baseline. They do prevent treating this document as a completed business brief or unconditional launch authorization.

## 9. AI implementation boundaries

The coding agent must read `intent.md` and the approved `spec.md` before planning changes. It must not turn open questions into company facts, silently switch the chosen package manager or deployment platform, introduce optional services, or weaken tests to obtain a passing build.

Record proposed deviations with their reason, affected requirements, cost/security implications, and verification approach. Obtain human review for architectural changes, paid services, and production/data-handling decisions. Keep implementation tasks in a subsequent `plan.md`, not embedded as unreviewed additions to the intent. The playbook treats the versioned artifacts and human decisions as the handoff and audit record.[^playbook-intro][^playbook-design]

## References

References explain framework capabilities and the document workflow; they do not turn recommendations into originator requirements. Recheck version-sensitive guidance during setup and upgrades.

[^playbook-intro]: Anthropic, [AI-Native SDLC Playbook — Introduction](https://academy.claude.com/courses/ai-native-sdlc-playbook/introduction).
[^playbook-intent]: Anthropic, [Capture as intent.md](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent).
[^playbook-design]: Anthropic, [Requirements and design](https://academy.claude.com/courses/ai-native-sdlc-playbook/requirements-and-design).
[^astro-cloudflare]: Astro, [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/).
[^cloudflare-assets]: Cloudflare, [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).
[^astro-typescript]: Astro, [TypeScript](https://docs.astro.build/en/guides/typescript/).
[^tailwind]: Tailwind CSS, [Install Tailwind CSS with Astro](https://tailwindcss.com/docs/installation/framework-guides/astro).
[^astro-content]: Astro, [Content collections](https://docs.astro.build/en/guides/content-collections/).
[^astro-editor]: Astro, [Editor setup](https://docs.astro.build/en/editor-setup/).
[^playwright-emulation]: Playwright, [Emulation](https://playwright.dev/docs/emulation).
[^playwright-a11y]: Playwright, [Accessibility testing](https://playwright.dev/docs/accessibility-testing).
[^wcag]: W3C, [How to Meet WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/).
[^pnpm-install]: pnpm, [pnpm install](https://pnpm.io/cli/install).
[^cloudflare-actions]: Cloudflare, [Deploy with GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).
[^cloudflare-billing]: Cloudflare, [Static Assets billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).
