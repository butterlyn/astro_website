# Specification: LEER company website

**Status:** Consolidated requirements and proposed implementation for human review. The originator's stack, branch workflow, and release-PR automation are confirmed; detailed configuration below is not a claim of completed implementation.  
**Updated:** 15 September 2026. References originally checked 14 September; follow-up evidence is in [the plan](plan.md) and [research](research/workflow-feasibility-2026-09-15.md).  
**Intent:** [intent.md](./intent.md).  
**Basis:** The earlier website drafts, subsequent decisions in the conversation, and the primary sources below. This revision replaces conflicting earlier assumptions rather than appending an alternative design.

## 1. Authority, scope, and decision status

The intent defines the originator's outcomes and confirmed choices. This specification translates them into requirements, a recommended design, risks, and acceptance evidence. This separation follows the referenced AI-native SDLC playbook.[^playbook-intent][^playbook-design]

**Confirmed:** Astro, Markdown-first content, Tina, Impeccable, Agentation, pnpm, GitHub Actions, Cloudflare, establishing the shared `development` branch, approved releases through `main`, and automatic maintenance of one open release PR.

**Proposed implementation:** the particular schema, build modes, Cloudflare Access setup, supporting quality tools, media configuration, CI job structure, and operating procedures below. “Must” states an acceptance requirement of this design; it does not imply the corresponding test has passed. The agreed plan authorises establishing `development` as default, the selected private editing origin and account configuration needed for implementation. Paid services and material deviations still require a new decision. Public test releases remain subject to the originator’s deliberate release decision.

The baseline is a public company/marketing website plus a private team editing and review environment. Include approved page layouts, navigation, footer, responsive styling, and a real not-found page. Do not invent business claims, testimonials, prices, contact information, or legal text. Blogs, case studies, pricing pages, visitor forms, analytics, and other integrations require an actual business requirement. Editor authentication is in scope; visitor accounts, payments, product dashboards, and native applications are not.

### 1.2 Confirmed prototype milestone and feasibility gates

The originator confirmed [plan.md](plan.md), Q1–Q10. The first milestone is the working editing/review/release system using existing placeholder design and representative test content. Placeholder labelling, noindex and disallowed crawling remain through human-approved test releases to the existing public domain. Final company messaging, brand/design, company-content acceptance and search launch are deferred. The repository remains public, with public draft-source visibility accepted and media restricted to assets approved for public exposure.

Four people will share Tina, normally one editor at a time. Implement and prove a site-wide editing reservation against individual Access identity and browser-session ownership. Use atomic SQLite Durable Object state rather than KV/memory and HTTP rather than WebSockets. Gate editor admission and ordinary saves; coordinate document operations and media through explicit handoff with the accepted cooperative limitation. Do not grant ownership to a new session merely because a heartbeat expires while an old write is unresolved. Preserve unsaved work and require reload/reconciliation after handoff; keep reviewing independent of editing.

Phase 2 must demonstrate the supported integration and actual runtime before content expansion. During implementation, tests against Tina 3.13.0 reproduced the save/media gap, and the originator explicitly accepted a cooperative editing reservation with explicit handoff and manual recovery for stale or uncertain writes. Ordinary saves check their original reservation; media/deletion and already-issued writes retain documented coordination limits. Do not patch internal APIs, purchase a paid plan or build a custom content/media backend. Shared-account entitlement is a separate gate.

Only the originator may publish initially through a deliberate passing release PR merge. Production recovery must verify an earlier approved revision, pause normal publication, share deployment serialisation, invalidate stale normal runs, and preserve unpublished development work. The full recovery and acceptance contract is in the plan.

### 1.1 Non-negotiable workflow invariants

| ID | Invariant | Intent |
| --- | --- | --- |
| **W-01** | Business-maintained content is Markdown-backed and Tina-editable; substantial editable copy is not hardcoded in presentation components. | I-04, I-05; C-05, C-06 |
| **W-02** | The shared preview combines content and code from `development`; the production build uses the approved `main` revision. | I-07; C-09, C-10 |
| **W-03** | Unsaved rendering, saving, preview deployment, review, and public deployment are distinct operations. No ordinary Tina save publishes production. | I-07; C-10 |
| **W-04** | The release action creates/reuses at most one open same-repository `development` → `main` PR. It never approves, merges, or changes branch contents. | I-09; C-11 |
| **W-05** | Editing routes and review tooling are private and excluded from the public build. | I-07 |
| **W-06** | The baseline does not depend on paid Tina Editorial Workflow, trial credits, or an always-on coding-agent service. Free-tier feasibility is verified rather than assumed. | I-08 |
| **W-07** | AI/developer changes preserve content editability and follow the same review/release boundary as content changes. | I-02, I-05, I-06; C-07–C-10 |

## 2. Architecture and tooling

| ID | Area | Decision |
| --- | --- | --- |
| **D-01** | Framework | Astro; static, multipage public output by default. Do not turn the marketing website into a site-wide client application. |
| **D-02** | Package management | pnpm with a committed `pnpm-lock.yaml`. No competing npm/Bun/Yarn lockfiles. |
| **D-03** | Tooling runtime | A supported Node.js LTS release compatible with the actual Astro, Tina, and Wrangler versions. Pin Node and pnpm. Node is not the deployed Worker runtime. |
| **D-04** | Language | Strict TypeScript and explicit Astro/type checks separate from building. |
| **D-05** | Styling | Proposed Tailwind CSS Vite integration, shared semantic design tokens, and ordinary CSS where clearer. |
| **D-06** | Components | Astro first; native HTML/CSS and small TypeScript enhancements. Permit an isolated React dependency for Agentation in the private review build, not site-wide public hydration. |
| **D-07** | Content | `.md` bodies and frontmatter. Tina's schema is the editorial contract; share validation and rendering semantics with Astro rather than maintain disconnected models. |
| **D-08** | Formatting/linting | Proposed Prettier plus `prettier-plugin-astro` for formatting; Biome for standalone JS/TS linting with its formatter disabled. Use Astro checks for `.astro` correctness; avoid competing formatters. |
| **D-09** | Tests | Proposed Playwright, `@axe-core/playwright`, focused content/renderer tests, and unit tests for release-action logic. Use an existing suitable runner before adding another. |
| **D-10** | Cloudflare | Separate public and editing Workers/deployments from one repository. Public output uses static assets; editing includes the runtime needed by Tina's refresh endpoint. |
| **D-11** | Delivery | Repository-installed Wrangler invoked by GitHub Actions. Disable competing automatic Cloudflare build/deploy paths. |
| **D-12** | CMS backend | Proposed single TinaCloud Free project fixed to `development`, subject to account and media checks. Local Tina development mode is not the remote team backend.[^tina-cloud] |
| **D-13** | Preview protection | Cloudflare Access with individual allowlisted email-code logins on the entire editing Worker, plus Tina authentication for content modification.[^cf-access] |
| **D-14** | Visual feedback | Agentation in the protected review build; GitHub Issues hold submitted feedback. No separate hosted feedback database initially. |
| **D-15** | AI design | Impeccable in prepared developer/agent sessions; accepted source changes enter the normal branch workflow. |
| **D-16** | Release preparation | Small idempotent GitHub Action ensuring a single release PR; exact contract in section 8. |

Select compatible released versions at implementation time and record them. Do not copy unverified version numbers from earlier conversational examples, use floating `latest` in CI, or install a different runtime simply because an upstream tool uses it internally. Pin third-party Actions to reviewed immutable revisions, and commit the Cloudflare compatibility date deliberately.

### 2.1 Two build targets, one source model

```text
Tina edits ──────────────────────────┐
                                    ├── development
Developer / AI / Impeccable changes ┘        │
                                  checks + editing build
                                            │
                                  private shared preview
                                            │
                                  one ongoing release PR
                                            │
                                   human review + merge
                                            │
                                           main
                                            │
                                 checks + production build
                                            │
                                    public Cloudflare site
```

| Concern | Editing/review target | Production target |
| --- | --- | --- |
| Branch | Explicitly `development` | Explicit approved `main` commit |
| Proposed hostname | `edit.leer.education`; selected in Q6 | Existing approved public hostname; preserve established domain/redirect settings |
| Content | Saved development content; temporary unsaved overlay only in an editing session | Content and media from the checked-out release commit |
| Tina admin/refresh | Included | Routes, generated admin assets, bridge, and edit markers excluded |
| Agentation | Enabled in review mode | Not imported into the delivered client bundle |
| Runtime | Astro Cloudflare adapter for editing routes | Static assets unless a separately approved feature needs a runtime |
| Access | Approved team identities | Public |
| Credentials | Only editing-specific runtime needs | No CMS credentials in client assets; deployment token confined to its CI job |

Use an explicit build target, not `NODE_ENV` or `import.meta.env.DEV`, to distinguish a hosted review build from production. Both are normally optimised builds. Build in clean, separate output directories so generated `public/admin` assets or stale bundles cannot leak between targets. Merely hiding a toolbar is insufficient.

Do not require production to query mutable TinaCloud branch content at request time, or fetch a moving branch head during its build. Render the exact checked-out release snapshot. Use a common validated model and renderer with adapters for local Markdown and Tina's metadata-aware editing data. Test equivalent rendering; do not strip the source metadata needed for contextual editing while transforming Tina data.

## 3. Markdown-first content with maximum Tina editability

### 3.1 Editorial model

Use ordinary Markdown for prose-heavy pages. Use frontmatter fields and an ordered list of typed sections for composed pages. A homepage should be content-driven too, not an exception with its copy embedded in `.astro` files.

Tina provides rich-text body fields and object/list templates; template records use `_template` by default.[^tina-richtext][^tina-objects] The following is a proposed format, not supplied company copy:

```markdown
---
title: Home
description: Approved search description.
template: landing
blocks:
  - _template: hero
    heading: Approved headline
    summary: An approved explanation of the company.
    image: /uploads/hero-v1.webp
    imageAlt: An appropriate description.
    buttons:
      - label: Learn more
        href: /about/
    layout: imageRight
    theme: light
  - _template: richText
    body: |
      ## What we do

      Ordinary **Markdown** content, edited through Tina's GUI.
  - _template: featureGrid
    heading: Why choose us
    columns: three
    items:
      - heading: First benefit
        description: Approved explanation.
---
```

A prose page instead has its title/metadata in frontmatter and its main rich-text field stored as the Markdown body (`isBody: true`). Do not duplicate that body in a second field. Landing pages may contain more structured frontmatter than prose: this is the deliberate compromise between readable `.md` files and extensive visual composition controls.

Do not require MDX initially. Components embedded inside rich text are a separate feature decision, not a prerequisite for frontmatter section templates. Define and test the supported Markdown subset, including headings, emphasis, lists, links, images, and any needed tables/code. Unsupported constructs must be identified before migration; saving through the GUI must not silently destroy content.

### 3.2 Editability coverage

| Content or object | Required editorial access |
| --- | --- |
| Authored text | Headings, prose, labels, button text, captions, approved form text/status messages where such a form exists |
| Media | Selection/upload where safely configured, alternative text, captions, and approved display options |
| Links | Navigation, calls to action, social links, destination and accessible label |
| Repeated content | Add/remove/reorder cards, features, testimonials, FAQs, team entries, and other actually required objects |
| Page sections | Add/remove/reorder supported section types; do not constrain ordinary page assembly to code changes |
| Presentation | Meaningful bounded choices such as theme, alignment, image side, width, spacing, and grid preset |
| Shared content | Navigation, footer, contact details, and relevant global brand content |
| Metadata | Page title, description, sharing image, and approved route-related settings |

Implement only section types the approved site needs; the examples above are not authorisation to invent testimonials or other content. Non-visible fields such as alt text and metadata need clear sidebar controls rather than artificial click targets. Mark shared fields clearly so an editor understands their site-wide effect.

Expose semantic choices instead of raw Tailwind class strings, CSS, HTML, or JavaScript. Maintain tested responsive layouts and accessible design tokens behind those choices. Arbitrary free-form layout/code changes remain an Impeccable/Agentation-assisted development task, not a promised CMS canvas feature.

### 3.3 Schema, routes, references, and validation

Keep the schema, labels/help text, defaults, validation, section renderer, and editor bindings together as one component contract. A new component is incomplete until all of them and its editing tests exist.

Use singleton documents for shared settings and references for content genuinely reused across pages. Avoid both copying shared content into every page and one giant document for the entire site. Keep independently maintained material in separate files where sensible. Stable section/object identifiers should survive reordering where needed for rendering and feedback; array position alone is not a reliable long-term annotation identity.

Implement route generation once so adding a page through an approved template does not require creating a new Astro source file. Validate unique paths, reserved routes, references, required metadata, media existence, and publication state. Path changes require explicit redirect handling; do not let a routine heading edit accidentally change the URL. Handle deletion and broken references visibly.

Use Tina's schema as the primary editorial definition. Astro Content Collections may assist static loading/validation, but must not establish conflicting defaults, field names, or unsupported rich-text semantics. Test a common normalisation layer rather than independently reimplementing the two renderers.[^astro-content]

Create an editability inventory for each route and shared component: rendered content/object, source document/field, form control, contextual binding, and intentional exception. Require a reason and review for any stakeholder-maintained value left hardcoded. Browser-generated and third-party UI outside project control should be identified rather than misrepresented as editable.

## 4. Tina integration, saves, and media

### 4.1 Contextual editing

Tina's current Astro integration uses metadata-aware data requests, editable regions, and an on-demand HTML refresh endpoint. It is not necessary to rewrite the page tree in React.[^tina-astro]

In the editing target, wire every relevant content query through the supported metadata-aware API, associate visible fields with their source data, and register editable regions for the page and shared layout. Use the unsaved overlay during refresh rather than re-reading only the saved Markdown. Preserve bindings through nested components. Connect document selection to the correct website route and identify the primary page document, not an unrelated footer form.[^tina-field][^tina-router]

Rich-text click-to-edit can focus the containing body field; it need not make every word a separate field. Expose non-visible settings in the sidebar. Confirm nested lists, referenced documents, global content, and empty optional regions work—not only a demo heading.

The refresh route needs a server adapter even when the pages are prerendered. Use the current supported Astro/Tina route helpers, but treat experimental APIs as version-pinned integration points with upgrade tests.[^tina-astro-repo] The Cloudflare implementation must include the compatibility settings required by the pinned integration, including `nodejs_compat` where required. Explicitly configure the editing target and content branch in GitHub Actions rather than relying on Cloudflare Builds environment detection.[^tina-cloudflare]

Inspect generated adapter bindings. Disable unused facilities when supported; otherwise provision required resources once, pin their identifiers, and include their quotas in the free-tier assessment. Do not create a fresh session/KV resource on every deployment.

### 4.2 State and persistence

| State | Meaning and visibility |
| --- | --- |
| Unsaved editor change | Session overlay rendered by the refresh endpoint; no Git persistence and no public release |
| Saved content | TinaCloud has accepted a write to `development`; allow for indexing/synchronisation delay |
| Deployed preview | A successful development build is available at the private address; show the deployed code revision |
| Review-ready batch | The team has checked the saved state against the latest compatible preview and PR head |
| Merged release | A human has merged the reviewed batch into `main`; production is not yet assumed updated |
| Public release | Production checks, deployment, and smoke verification have succeeded |

A saved change may become available to the editor before the static preview rebuild finishes. Display these states honestly. The code revision shown on a preview is not proof that a live unsaved overlay or a newer content query matches that revision. For release review, use saved content, refresh after the successful build, and confirm the reviewed code/content pair.

Configure the editing application to save content only to `development`; do not silently fall back to `main` when an environment variable is missing. Fail the build/startup on an invalid branch/target combination. Commit the generated `tina/tina-lock.json` required for TinaCloud indexing when schema changes require it.[^tina-cloud]

Local development and Cloud-backed collaboration are different modes. Document their commands, required variables, authentication, and source of content. Do not tell remote teammates to connect to the maintainer's `localhost`.

### 4.3 Media branch and confidentiality: explicit setup gate

**Newly verified constraint:** Tina's default repo-based media reads/writes the repository's default branch, independently of the selected editing branch. Its documented branch-aware media workflow depends on Editorial Workflow. The media service also publicly serves synced assets.[^tina-media]

**Confirmed low-cost configuration (Q5):** make the repository's default branch `development`, align Tina's default media storage with it, and keep every production/release target explicitly fixed to `main`. The originator selected this change in the agreed migration plan. Audit effects on default PR bases, manual workflows, integrations, and media sync before changing the setting. The website's public release branch need not be its GitHub default branch.

After configuration, test actual uploads and deletions and inspect the resulting commits: they must affect `development`, never `main`. Do not assume `TINA_BRANCH=development` alone controls media, invent an unsupported media-branch setting, or treat a failed Git commit with a successful media upload as safe persistence. Blocking writes to `main` without fixing the media workflow is not a complete solution.

Production must serve approved media copied from the release checkout, using repository-relative references rather than a mutable draft-media URL. Use new immutable filenames for replacements. Validate references before release; deleting draft media must not remove the asset from the already deployed production release.

Private page access does not make Tina's public media CDN confidential. Restrict the baseline media service to assets approved for public availability independently of publication timing. When unpublished assets must themselves remain secret, stop and obtain approval for a protected media design; do not falsely claim the default setup provides that guarantee. Do not expose all repo content as static assets. Keep drafts, source documents, and restricted attachments out of public output.

If the default-branch change is not acceptable, retain the selected stack but resolve a supported safe media configuration or an explicitly approved custom backend before enabling unrestricted GUI uploads. Do not silently buy paid Editorial Workflow or reduce the user's editing requirement. This is an implementation gate, not a reason to hide missing functionality.

## 5. Private preview and access control

### 5.1 Protection boundary

Protect the entire editing Worker with Cloudflare Access. Worker-level protection covers its domains, routes, `workers.dev` hostname, and preview URLs; verify every entry point rather than protecting only `/admin`.[^cf-access]

Use the selected explicit allowlist of individual identities with email-code login. Retain Tina authentication/authorisation for CMS changes as a separate boundary. A reviewer who only views the protected preview or exports annotations should not require a Tina seat. The originator expressly selected one shared Tina identity for four people, generally one editor at a time. Verify the provider’s entitlement and session behaviour before onboarding; one credential is not evidence that four humans count as one Free-plan user. Individual Access revocation does not revoke retained Tina credentials. Document shared-session/credential recovery; never share personal GitHub or Cloudflare credentials.

Prefer the admin and editable preview on the same protected origin. Test session expiry, login redirects, iframe operation, image loading, and refresh requests behind Access. Same-origin/content-type checks and editor-mode detection do not establish user identity. Configure any permitted origins narrowly; no wildcard cross-origin credentials.

Include noindex directives on previews as defence against accidental indexing, not as security. Review caching so private responses/overlays are not cached for other users. Apply appropriate security headers without breaking legitimate same-origin editor frames. Reject unknown regions, invalid payloads, unsafe URLs, and unreasonable request sizes.

### 5.2 Credentials and trust

Do not expose Tina content tokens, Cloudflare deployment credentials, service tokens, or GitHub tokens in browser bundles, public environment variables, source maps, logs, or feedback. Use server-side secrets only where needed and scope them to the relevant project/branch/operation. An editor-facing app identifier is not a substitute for authentication.

Keep deployment secrets out of the web runtime and untrusted test jobs. Untrusted pull requests must not execute with release credentials; do not use `pull_request_target` to run untrusted branch code. Keep secrets for accessing the private preview out of screenshots, traces, and issue bodies.

**Free-plan trust limit:** private GitHub Free repositories do not provide the same branch-protection controls as eligible paid plans.[^gh-protection] Do not describe a WIP title, a reviewer convention, or unprotected environment naming as an enforced security barrier. A collaborator able to modify credential-bearing workflows can affect the credential boundary. Document the trusted-small-team assumption and use supported protections where available. Do not make the repository public merely to obtain free controls while exposing confidential drafts.

## 6. Collaboration and branch lifecycle

Use one shared `development` branch and one shared preview. Tina content saves and ready developer changes converge there. Developers/agents may use temporary local branches or worktrees and merge ready changes into `development`; those branches do not need paid Tina branching or their own hosted previews.

Coordinate same-document editing. Do not promise real-time conflict-free co-editing, per-field merging, or locks not verified in the deployed version. Test two browsers saving the same document, including different fields, and document the observed behaviour. Different documents reduce collisions; shared global files and AI edits still need coordination. Do not use force pushes to resolve content races.

Deliver schema changes with matching components, generated schema state, and content migrations. Pause editing during incompatible changes and reload stale sessions after deployment. Keep the shared branch usable; do not commit half-implemented section types that break other editors.

All changes in a release PR form one batch. Near final approval, briefly pause saves and pushes, confirm the latest head and preview, and merge that revision. A later save changes the release candidate and invalidates an earlier informal approval. Where supported, use stale-approval dismissal and required checks; otherwise record the operating convention and residual risk.

Retain `development` after release. Use a normal merge commit for its release into `main`, rather than repeatedly squash-merging a long-lived branch; GitHub documents repeated-review/conflict problems from that pattern.[^gh-merges] Synchronise subsequent `main` fixes back without resetting or discarding unpublished development work. Disable automatic deletion for this long-lived branch. The release-PR action must never perform this synchronisation itself.

## 7. Continuous integration and deployments

### 7.1 Workflow responsibilities

| Proposed workflow | Trigger and purpose | Safety/cost boundaries |
| --- | --- | --- |
| `checks.yml` | Trusted pushes and relevant PRs; validate source, schema, build, and behaviour | Read-only by default; avoid duplicate expensive runs for the same revision |
| `preview.yml` | Push to `development`; deploy the validated editing target | Private Worker only; cancel superseded build work and prevent stale final deployment |
| `ensure-release-pr.yml` | Push to `development`, plus manual reconciliation | Only list/compare/create the release PR; no source changes or deployments |
| `production.yml` | Approved release merge reflected on `main` | Validate release provenance, build the approved snapshot, deploy, and smoke-test |

Names are proposed contracts, not existing files. Shared jobs may be reusable; avoid building an elaborate orchestration platform for a small website.

A fresh checkout must support documented commands for frozen installation, local development, Tina-enabled development, formatting checks, lint/type/content checks, both build targets, browser tests, and local Cloudflare preview. Use `pnpm install --frozen-lockfile` in CI. Validate metadata, references, routes, and editor-production exclusions. No failed required check may be bypassed by deploying a previously unrelated artifact.

Attach revision and build-target identity to artifacts and deployment records. The preview's deployed code and schema must be compatible with its content; an admin branch switch cannot deploy new Astro source. Confirm save-generated Tina GitHub writes actually trigger the expected push workflow.

### 7.2 Trigger and race handling

Run development checks/preview from the development push path rather than relying solely on the bot-created PR event. GitHub currently puts certain PR events created with `GITHUB_TOKEN` into an approval-required workflow state; ordinary token-generated pushes do not recursively trigger workflows. Handle any AI workflow that writes with that token through explicit trusted dispatch/reusable-job logic, not an assumption that downstream jobs run.[^gh-triggers]

Use separate concurrency groups for release-PR management, preview deployment, and production deployment. Cancel obsolete preview builds to save minutes; do not blindly cancel an in-flight deployment and assume that prevents it reaching Cloudflare. Serialise final deployments and recheck the target head/artifact identity before publishing. Concurrency queues are not a guarantee of chronological execution, so an older run must not overwrite a newer deployment.[^gh-concurrency]

Production must verify the intended release and operate on its checked-out commit. Ordinary direct Tina/media writes to `main` are errors, not implicit approval. Provide an explicit owner-controlled recovery procedure for emergencies. A merge followed by a failed build leaves the previous live deployment in place and must be reported as a failed publication, not a successful release.

Retain concise failure diagnostics and short-lived browser traces. Budget CI usage for repeated Tina saves; no required cron polling, continuous hosted agent, or per-editor preview fleet.

## 8. Automatic single release-PR action

### 8.1 Contract

Implement `.github/workflows/ensure-release-pr.yml` as an idempotent **ensure-exists** job, not a create-on-every-push job. Match by repository identity, `head = development`, `base = main`, and open state, never by title alone. GitHub's PR API supports the required filters.[^gh-pr-api]

The action must:

1. Read explicit configuration and current branch state. Provide an owner-controlled pause switch and manual dispatch for recovery. Never infer the destination from the repository default branch.
2. Find open PRs for the exact same-repository branch pair, with pagination/adequate filtering. With exactly one, report its URL and leave it unchanged; subsequent commits are already part of that PR.
3. If unexpected duplicates exist, create nothing and fail/report for human resolution. Do not automatically close someone else's review.
4. With none open, determine whether the current development history has a non-empty releasable diff relative to `main`. Use merge-base/ancestry-aware comparison; do not open a reverse-change PR merely because `main` contains a newer release merge or hotfix. When comparison is ambiguous, report the need for reconciliation rather than changing branches.
5. Recheck before creation and create one PR only when a release diff remains. Handle a creation race by querying again. Treat the discovered matching PR as success; surface unrelated permissions/API failures.
6. Return a stable outcome such as `created`, `reused`, `no_changes`, `paused`, or `needs_attention`, with the PR URL where applicable.

Do not repeatedly edit the title/body, post per-save comments, reset readiness, or erase reviewer discussion. Do not create temporary branches or commits. No checkout is needed merely to use the REST API; if a helper is used, avoid package installation and unnecessary execution of project code in this privileged job.

### 8.2 Trigger, permissions, and concurrency envelope

This is a design excerpt, **not a complete runnable workflow**; the implementation supplies the API logic and tests described here:

```yaml
name: Ensure website release PR

on:
  push:
    branches: [development]
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: write

concurrency:
  group: ensure-development-main-release-pr
  cancel-in-progress: false
```

Use this constant group for all entry points to the same action. A later run checks current state, so intermediate queued runs need not all execute. Serialisation plus a post-error recheck addresses both workflow races and a human creating the PR at the same time.[^gh-concurrency]

Enable the repository/organisation setting that permits Actions to create PRs. Its combined “create and approve” wording does not authorise this action to approve anything. `pull-requests: write` is still a capability-bearing permission: enforce the narrower behaviour through reviewed code and negative tests, not a claim that the token is intrinsically unable to approve. Do not add `contents: write`, a broad personal token, or production credentials merely for convenience.[^gh-actions-settings]

### 8.3 Draft status, pause, and lifecycle

Use native draft PRs for the selected public repository. Do not silently change repository visibility or substitute an ordinary PR on a draft-creation error. GitHub currently distinguishes public Free draft availability from paid private-repository capabilities.[^gh-pricing] A WIP title is a convention, not an enforced merge lock. Select the mode explicitly; do not silently upgrade a subscription or retry every error as an ordinary PR.

A suggested initial body links the private preview and includes the statement “Saving adds changes to this PR; publication requires human review and merge.” Do not put confidential preview credentials in it. Human changes to the description remain intact.

The action must never approve, merge, enable auto-merge, or delete a branch. When the current PR merges, it creates no replacement until unreleased changes exist. A manual close alone does not trigger creation. While the pause switch is set, all creation stops; without a pause, the next development push may legitimately open a replacement. Document that behaviour so manually closing a PR is not mistaken for a permanent automation pause.

If an existing PR becomes empty because changes were reverted, leave it for human disposition and report that no changes remain. An automated administrative action must not silently discard the review record.

### 8.4 Required action test cases

| Case | Expected result |
| --- | --- |
| First non-empty development change | One matching PR created |
| Many later saves and developer commits | Same PR reused; discussion and readiness untouched |
| Simultaneous action runs | At most one creation; subsequent run reuses it |
| A human creates the PR between list and create | Requery resolves the race without another PR |
| Foreign-repository or wrong-base PR with similar title | Not mistaken for the release PR |
| No unreleased diff, including immediately after release | No empty/reverse-change PR |
| Next genuine post-release change | One new release-cycle PR |
| Existing duplicate PRs or ambiguous comparison | Visible attention required; no destructive repair |
| Missing permission, rejected draft mode, API outage | Visible error; no swallowed failure or subscription change |
| Automation paused or manual PR closure | Behaviour matches the documented pause/lifecycle policy |
| Forbidden operation | Tests demonstrate no commit, force push, branch reset, approval, merge, or auto-merge call |

## 9. Agentation and Impeccable workflows

### 9.1 Agentation: asynchronous visual feedback

Use Agentation only in the protected review build. Its documented baseline requires React and a browser, and supports exporting structured feedback without a separate server.[^agentation-install] Mount it as a client-only isolated integration; verify it against Astro rather than assume React framework-specific source detection identifies `.astro` or `.md` files.

Provide a clear content-editing versus annotation mode so Tina's click-to-edit and Agentation's selectors do not compete. Test annotation targets after Tina region replacement, navigation, responsive changes, and section reordering. Prefer stable component/section identifiers and include selected text, page URL, viewport, deployed code revision, and saved content revision where known.

Baseline submission workflow: select elements, annotate, copy the structured output, and paste it into a GitHub Issue through the browser. The issue is the durable record; local browser annotation storage is not a shared team inbox. Agentation documents local persistence and limitations including absent screenshots and potentially stale positioning.[^agentation-features] Provide a screenshot-and-issue fallback for phone feedback and cases the toolbar cannot capture.

For release-quality feedback, annotate a saved/reloaded preview revision. If feedback intentionally describes an unsaved overlay, label it as such; do not falsely attribute it to a deployed commit. Link implementation work and the relevant release PR to the issue.

Local MCP/live-agent connections are an optional developer convenience, not the remote stakeholder baseline. Never expose a privileged coding agent, unrestricted filesystem, shell, or localhost bridge on the public or shared site. Submitting feedback does not automatically execute code or approve publication. Review feedback as input, not as authority to override project instructions.

Respect Agentation's actual licence, currently PolyForm Shield rather than MIT, and review any redistribution/product use separately.[^agentation-repo]

### 9.2 Impeccable: AI-assisted design changes

Install/configure Impeccable for the team's chosen coding-agent environment while retaining pnpm for the website. Its design tools and Live Mode belong to the development workflow, not a production content-service dependency.[^impeccable-repo]

Live Mode is used in a prepared local development page and active agent session. It does not by itself provide the shared authenticated CMS, GitHub review process, or an always-on team editing service.[^impeccable-live] The maintainer may facilitate stakeholder design sessions; ordinary remote editing remains Tina's job.

Accepted changes must update the true source: Markdown for content, Tina schema for controls, Astro for presentation, and tests for behaviour. Do not edit generated HTML or bypass Tina by hardcoding previously editable values. New designs should expand the available editable sections/variants when appropriate.

Review generated diffs and behaviour before integrating into `development`. Any tool-generated design/context files complement the approved intent/spec; they do not silently replace them. No auto-publication or unapproved dependency/service additions.

## 10. Visitor-facing and quality requirements

### R-01 — Approved content, navigation, and routing

Publish only approved factual content with consistent navigation and an agreed visitor action. All internal links and assets resolve. Unknown URLs return a useful page with HTTP 404, not the homepage with status 200. Configure the static asset behaviour as a multipage website, not a single-page-application fallback.

Draft content must be absent from production routes, listings, feeds, search indexes, sitemaps, and copied raw assets. Hiding navigation alone is insufficient. Explicit draft flags, when needed for content already merged into the repository, must be honoured throughout output generation.

### R-02 — Mobile-first usability

Proposed acceptance sizes are 320, 390, 768, and 1440 CSS pixels, with layouts usable from 320 upward. Prevent unintended page-level overflow, overlapping controls, clipped text, and inaccessible navigation. Deliberately scrollable tables/code can scroll in their own containers.

Support text resizing, touch, keyboard navigation, readable typography, responsive images, and an appropriate viewport declaration. Aim for 44 × 44 CSS-pixel primary controls as a project usability target, not a claim about the universal WCAG minimum. Do not rely on hover. Test real mobile Safari and Chrome as well as browser emulation.[^playwright-emulation]

### R-03 — Accessibility

Use WCAG 2.2 AA as the proposed target, subject to supplied company policy. Provide semantic HTML, useful alternative text, labels, logical headings, sufficient contrast, visible focus, sensible focus order, and reduced-motion behaviour.[^wcag]

Automated checks must be supplemented by manual keyboard, zoom, screen-reader, and main-journey review. Passing axe or Playwright does not certify complete conformance.[^playwright-a11y]

### R-04 — Performance and progressive enhancement

Core content and essential navigation remain usable without client JavaScript. Keep required scripts local to their interaction. Optimise appropriately sized media, reserve dimensions, avoid lazy-loading the principal above-the-fold image, and limit fonts/third-party scripts.

Record Lighthouse mobile diagnostics on representative builds before launch and after substantial changes. Set numerical budgets after the actual design/content is known; do not mistake a synthetic score for real-user guarantees. Keep all editor/review bundle weight out of production.

### R-05 — Search and sharing

Provide approved titles, descriptions, canonical URLs, sharing metadata, a consistent URL policy, and an intentional sitemap/robots configuration. Do not invent structured company facts. Public canonical URLs use the approved domain; the private environment remains non-indexable and authenticated. Preserve the existing approved `www` redirect/canonical policy rather than changing it incidentally.

### R-06 — Forms and third-party integrations

Implement only approved functionality. A form must have a real destination, validation, abuse controls, tested delivery/error behaviour, and a documented data-handling policy; otherwise use an approved contact link rather than a nonfunctional form. Keep secrets server-side. Do not make the whole public site request-time-rendered merely for a narrow endpoint.

Analytics, trackers, cookies, paid APIs, and visitor data collection require their own approval and applicable policy assessment.

## 11. Free-tier feasibility and cost controls

The target is no required recurring platform subscription, not a guarantee of zero total cost at arbitrary scale. Verify against actual account plans, editor numbers, deployed resource use, and current terms before launch. Do not authorise paid overages, convert a trial to a subscription, or weaken privacy without approval.

| Service | Current relevant constraint | Required treatment |
| --- | --- | --- |
| TinaCloud Free | Two user accounts; not two concurrent sessions. Paid Editorial Workflow is not the selected design.[^tina-pricing] | Count administrators and editors. Preview-only reviewers should not need Tina accounts. Resolve an excess account need explicitly; no shared login. |
| Cloudflare static assets | Static asset requests are not charged as Worker invocations.[^cf-assets-billing] | Keep public serving static; validate output/storage/file limits for the actual build. |
| Cloudflare Workers Free | 100,000 dynamic requests/day and 10 ms CPU per invocation; waiting on network is distinct from CPU.[^cf-limits] | Measure Tina refresh requests, including cold and complex cases. Small team size alone does not establish CPU suitability. |
| Cloudflare Access Free | Published Free allowance is up to 50 users.[^cf-zero-trust] | Verify identities and all editing entry points are covered within account limits. |
| GitHub Actions Free | Private-repository included usage currently includes 2,000 minutes/month and 500 MB artifact storage.[^gh-actions-billing] | Avoid duplicate runs, cache sensibly, retain artifacts briefly, and configure available spending limits. |
| GitHub private Free controls | Native drafts/protected-branch enforcement are plan-dependent.[^gh-pricing][^gh-protection] | Use ordinary WIP PRs and documented trusted-team controls when necessary; do not claim paid enforcement is present. |
| Impeccable/Agentation | Tool availability does not include coding-model usage or hosted development machines.[^impeccable-repo][^agentation-repo] | No always-on agent required. Account separately for AI usage and any approved compute. |
| Domain and operations | Registration/renewal, human maintenance, and existing AI subscriptions are separate from free website hosting. | Record actual owners and costs; do not describe them as universally free. |

**Deployment gate:** demonstrate reliable Tina editing on the actual Workers Free plan. Record request CPU/failures, representative large documents/section counts, package size and bindings, and applicable auxiliary quotas. If the full required workflow does not fit, report evidence and proposed options for approval. Do not silently pay for Workers, disable live editing, or move hosting.

Media branch/privacy checks in section 4.3 are separate gates: a workflow can cost $0 and still be unsafe. Similarly, a free CMS tier does not imply unlimited editor accounts.

## 12. Acceptance and verification

These are required evidence to collect during implementation, **not tests executed while writing these documents**. Preserve baseline visitor checks alongside the new editing and release requirements.

| ID | Acceptance evidence | Traceability |
| --- | --- | --- |
| **A-01** | Approved audience, page inventory, content, brand, and visitor action; no published placeholders or invented claims. | I-01; Q-01–Q-03 |
| **A-02** | Fresh checkout with pinned pnpm/Node and committed lockfiles passes documented local and CI commands. | C-01–C-04; D-02–D-09 |
| **A-03** | Required-check failure prevents deployment; successful deployment identifies its exact commit and target. | C-02; W-02, W-03 |
| **A-04** | Links/assets/404 and draft exclusion work across all production outputs, including raw copied media/content. | R-01; W-05 |
| **A-05** | Responsive/browser tests pass at proposed widths with no unintended overflow; main flows checked in Chromium, Firefox, and WebKit. | I-03; R-02 |
| **A-06** | Main journeys manually reviewed on real mobile Safari/Chrome, including touch, zoom, and navigation. | I-03; R-02 |
| **A-07** | No unresolved serious/critical automated accessibility findings; manual findings explicitly resolved or dispositioned against the target. | R-03 |
| **A-08** | No-JS core navigation/content works; representative mobile performance and image/font behaviour reviewed. | R-04 |
| **A-09** | Production canonical/sitemap/redirects correct; editing site authenticated and non-indexable. | R-05; W-05 |
| **A-10** | Any approved form/integration has tested success/failure and approved data handling; otherwise absent. | R-06 |
| **A-11** | Named owner can reproduce deployment and restore a known-good approved release; recovery exercised. | I-02; section 13 |
| **A-12** | Editability inventory covers every stakeholder-maintained value/object, or records an approved exception. | I-04, I-05; W-01 |
| **A-13** | Nontechnical editor changes text, image/alt text, links, repeated objects, order/layout choices, and shared nav/footer without source editing. Save/reopen preserves them. | C-05, C-06; section 3 |
| **A-14** | New page using an approved template gets a valid route; invalid metadata, bad references, duplicate paths, and unsupported rich text are handled without silent data loss. | W-01; section 3 |
| **A-15** | Nested contextual bindings and unsaved refresh work on deployed Cloudflare, not only localhost; public output omits all editor routes/scripts/assets. | sections 2, 4, 5 |
| **A-16** | Actual Tina text saves, media uploads, replacements, and deletions affect development only; no production change before release. Public-media confidentiality policy verified. | W-02, W-03; section 4.3 |
| **A-17** | Anonymous/disallowed users cannot fetch admin, refresh, draft pages, or protected assets through any alternate hostname. Expiry/login/revocation paths tested. | I-07; section 5 |
| **A-18** | Two-browser same-document and different-document saves, stale schema sessions, and AI/content overlap tested; observed limitations documented. | section 6 |
| **A-19** | Each release-action case in section 8.4 passes with mocked API tests plus a controlled repository test; no duplicate PR or forbidden write/merge operation. | I-09; C-11; W-04 |
| **A-20** | Repeated Tina and developer rounds update one PR; a release and subsequent batch produce the correct next PR without empty/reverse-change proposals. | W-04; sections 6–8 |
| **A-21** | Reviewer checks exact saved content/code revision; late pushes require renewed review; stale CI runs cannot overwrite newer deployments. | W-02, W-03; section 7 |
| **A-22** | Nontechnical reviewer creates useful Agentation feedback and persists it in an Issue; mode conflicts, stale annotations, and phone fallback tested. | I-06; C-08; section 9 |
| **A-23** | Impeccable-assisted change updates real source and preserves Tina controls, tests, and the same release workflow. | C-07; W-07 |
| **A-24** | Seat counts, dynamic CPU/request use, auxiliary bindings, CI minutes/storage, and spend settings support the stated cost model without trials or paid dependencies. | I-08; W-06 |
| **A-25** | Account/plan limitations and residual trust assumptions are documented and accepted; no secret appears in public output, feedback, or logs. | sections 5, 11 |

Before final acceptance, a nontechnical teammate should complete the whole sequence: sign in, edit, save, distinguish saved versus deployed state, submit an annotation, review an AI change, and observe a human-approved release. A maintainer-only demonstration is insufficient evidence of stakeholder usability.

## 13. Operations, recovery, and open decisions

Document account ownership, allowed identities, repository and branch settings, worker identifiers, hostnames, secret **names** (never values), build commands, deployment identity, media configuration, editor onboarding, and offboarding. Maintain separate editing and release runbooks understandable to their audiences.

Recovery should redeploy a known-good approved commit/artifact through the controlled delivery path, verify the result, and reconcile the source history without overwriting current drafts. Rehearse public rollback and recovery of a broken editing/schema deployment. An editing/Tina outage must not make the already deployed public site unavailable. Record dependency update policy and retest version-sensitive integration points.

| Open item | Required decision or evidence |
| --- | --- |
| **Q-01–Q-03: business/design** | Approved facts, audience, pages, assets, and approver. |
| **Q-04: people** | Names/roles and Tina account count; same-document coordination owner; release authority. |
| **Q-05: existing configuration** | Audit actual repository/default branch, Cloudflare workers/domains, workflow credentials, and protection features before changing them. `edit.leer.education` is a proposed address, not asserted deployed. |
| **Q-06: cost/capacity** | Actual Free-plan CPU/quotas and CI usage; deadline and expected scale; explicit approval for any unavoidable exception. |
| **Q-07: policy** | Relevant company policies and whether draft assets may be publicly accessible before page release. |
| **O-01: media branch** | Approve/reject the proposed repository default-branch change to `development`, or validate another safe supported media configuration. This remains a deployment gate. |
| **O-02: enforcement** | Confirm which review/branch/environment protections the actual GitHub plan can enforce and accept the remaining small-team trust assumptions. |
| **O-03: integration versions** | Verify the selected Tina/Astro/Cloudflare version combination, required bindings, editing/auth behaviour, and production isolation. |

Already resolved: whether to use a CMS, which CMS, whether Markdown is primary, the package manager, the shared branch name, the need for a private preview, and whether release-PR creation should be automated. Do not reopen those choices without new evidence and approval.

## 14. AI implementation boundaries and revision summary

Agents must read the current intent/spec before proposing a plan. They may not silently switch the stack, introduce a paid service, invent business content, publish changes, weaken tests, share credentials, force-push the shared branches, or reduce Tina editability to make an integration easier.

Unresolved business facts stay unresolved. For an implementation conflict, record the affected requirement, evidence, options, cost/privacy impact, and required approval. Detailed implementation steps belong in a later plan; these files are the requirements/design baseline, not permission to mutate accounts or production.

This revision supersedes earlier statements that Astro/Markdown were only under consideration, a CMS was optional, shared previews were optional, the whole system was assets-only, and the budget preference was unspecified. It preserves the prior visitor-quality, reproducibility, security, testing, and recovery requirements. It incorporates the chosen Tina-first editable architecture, private shared `development` preview, combined developer/content workflow, free-tier constraints, and approved single-release-PR automation.

**Validation status of this deliverable:** document structure, references, and coverage can be checked locally. No repository workflow, Tina integration, Cloudflare endpoint, account configuration, or website acceptance test is represented as installed or validated by this document update.

## References

Primary references support external capabilities and limits; they do not turn recommendations into user decisions. Recheck version-sensitive APIs, licences, plan entitlements, and prices during setup/upgrades. Links are portable so the files remain usable outside this chat.

[^playbook-intent]: Anthropic, [Capture as intent.md](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent).
[^playbook-design]: Anthropic, [Requirements and design](https://academy.claude.com/courses/ai-native-sdlc-playbook/requirements-and-design).
[^astro-content]: Astro, [Content collections](https://docs.astro.build/en/guides/content-collections/).
[^tina-cloud]: Tina, [TinaCloud overview](https://tina.io/docs/tinacloud/overview).
[^tina-richtext]: Tina, [Rich-text fields](https://tina.io/docs/reference/types/rich-text/).
[^tina-objects]: Tina, [Object fields and templates](https://tina.io/docs/reference/types/object).
[^tina-astro]: Tina, [Visual editing setup for Astro](https://tina.io/docs/contextual-editing/astro).
[^tina-astro-repo]: Tina, [Official Astro integration README](https://github.com/tinacms/tinacms/blob/main/packages/%40tinacms/astro/README.md).
[^tina-field]: Tina, [Click-to-edit API](https://tina.io/docs/contextual-editing/tinafield/).
[^tina-router]: Tina, [Visual editing router](https://tina.io/docs/contextual-editing/router).
[^tina-cloudflare]: Tina, [Deployment to Cloudflare Workers](https://tina.io/docs/tinacloud/deployment-options/cloudflare-workers).
[^tina-media]: Tina, [Repo-based media: default branch, public delivery, and caveats](https://tina.io/docs/reference/media/repo-based/).
[^tina-pricing]: Tina, [Plans and pricing](https://tina.io/pricing).
[^cf-access]: Cloudflare, [Protect Workers with Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
[^cf-zero-trust]: Cloudflare, [Zero Trust plans](https://www.cloudflare.com/plans/zero-trust-services/).
[^cf-assets-billing]: Cloudflare, [Workers Static Assets billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).
[^cf-limits]: Cloudflare, [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
[^gh-pr-api]: GitHub, [REST API: pull requests](https://docs.github.com/en/rest/pulls/pulls).
[^gh-concurrency]: GitHub, [Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
[^gh-triggers]: GitHub, [Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
[^gh-actions-settings]: GitHub, [Managing Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).
[^gh-pricing]: GitHub, [Plans and feature availability](https://github.com/pricing).
[^gh-protection]: GitHub, [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
[^gh-merges]: GitHub, [Pull request merges](https://docs.github.com/en/pull-requests/reference/pull-request-merges).
[^gh-actions-billing]: GitHub, [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
[^agentation-install]: Agentation, [Installation](https://www.agentation.com/install).
[^agentation-features]: Agentation, [Features and limitations](https://www.agentation.com/features).
[^agentation-repo]: Agentation, [Official repository and licence](https://github.com/benjitaylor/agentation).
[^impeccable-repo]: Impeccable, [Official repository](https://github.com/pbakaus/impeccable).
[^impeccable-live]: Impeccable, [Live Mode documentation](https://impeccable.style/docs/live/).
[^playwright-emulation]: Playwright, [Device and viewport emulation](https://playwright.dev/docs/emulation).
[^playwright-a11y]: Playwright, [Accessibility testing](https://playwright.dev/docs/accessibility-testing).
[^wcag]: W3C, [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/).
