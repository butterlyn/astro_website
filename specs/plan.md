# Website migration plan

**Status:** Implementation in progress. Repository bootstrap and local editing proof are being verified; hosted account/runtime acceptance and later phases remain open. See [implementation status](../docs/implementation-status.md).

**Prepared:** 15 September 2026.  
**Requirements:** The staged [intent](intent.md) and [specification](spec.md), with Git blob IDs `a0075c1902c7fd51af1f9d4c83e541fd4dbe0a14` and `a2558ab4d06bbfc5af64706f385e7235cdbce0ee`.  
**Inspected checkout:** `dummy/pipeline-proof-20260912`, commit `9e7b2d16c855e74b5e3c72c609200535786996cb`. The documents in the working tree matched their staged versions at inspection.

## Implementation steering — 15 September 2026

The originator requested implementation and subsequently confirmed:

- TinaCloud is not yet set up; provide setup/configuration guidance.
- Initial individual Access identity and editing-recovery owner: `admin@leer.education`. Additional reviewer identities remain to be supplied.
- After executable tests against pinned Tina APIs demonstrated the save/media coverage gap, accept **a cooperative editing reservation with explicit handoff**, including manual recovery for stale or uncertain writes. This replaces the stronger all-mutation guard acceptance language below. Retain an atomic site-wide reservation, no automatic timeout handoff, unsaved-text preservation/export, stale-form rejection on ordinary saves, owner recovery and independent review. It does not require a custom content/media backend or internal Tina patches.

The original Q1–Q10 decision record remains historical context. The stronger-guard stop condition has been resolved by the above explicit decision. Tina entitlement, hosted Access/authentication, actual save/media branch isolation, Free-plan runtime measurements and nontechnical acceptance remain required.

## 1. Outcome and scope

Implement the confirmed Astro, Markdown, Tina, Impeccable, Agentation, pnpm, GitHub Actions and Cloudflare workflow:

1. Nontechnical editors can maintain page content, shared content and supported page composition in Tina.
2. Content saves and integrated developer changes converge on `development` and a protected shared preview.
3. One release PR accumulates the batch for human review.
4. A human-approved release to `main` supplies the exact source snapshot for the public deployment.

The confirmed first deliverable is the **working editing/review/release system**, using the existing placeholder design and representative test content. Human-approved test releases will update the existing public placeholder at `leer.education`, retaining explicit placeholder labelling and noindex. This is an accepted temporary exception to the final site's publication-content rules. Final company messaging, brand/design work and public company launch are a later milestone.

The repository remains **public**: the user accepts public draft source while requiring login for the preview website. Uploaded assets must already be approved for public exposure. The requested Tina setup is one account used by multiple people; this supersedes the staged spec's no-sharing instruction for the proposed plan, with service entitlement/authentication feasibility still to verify.

`development` will become the GitHub default branch and the sole Tina/media draft destination. `main` remains the public release source. The private editing/review origin is `edit.leer.education`, protected by individual allowlisted email-code logins. Only the originator may publish initially, through a deliberate passing release-PR merge.

## 2. Actual starting point

| Area | Observed state | Migration implication |
| --- | --- | --- |
| Repository | Public `butterlyn/astro_website`; default branch `main`. No local or remote `development` branch found. | Establish `development` deliberately and make it default in the approved migration. Public visibility is retained. |
| Branch history | `main` is setup-only at `fc7672c`; the disposable branch contains six additional commits, including the website and proof pipeline. | Start a permanent integration history from reviewed material; do not merge the disposable branch wholesale. |
| Current site | Homepage and real 404; placeholder copy in TypeScript and Astro; no website Markdown, Tina, Agentation or content model. | This is a new CMS integration and content migration, not a repair of an installed Tina trial. |
| Public serving | `leer.education` and `leer-preview.butterlyn.workers.dev` returned identical placeholder HTML and the inspected build commit. `www` redirects to the apex, preserving path and query. | Preserve current serving and redirects. Account-side Worker/domain mappings require verification before changing or deleting the preview Worker. |
| Editing address | `edit.leer.education` did not resolve. | The hostname and individual email-code login model are now selected; provisioning is future implementation work. |
| Delivery | Only the disposable branch deploys, using a tested static artifact and stale-run safeguards. | Build permanent development/production paths and retain artifact/revision checks. |
| GitHub controls | `main` requires an up-to-date PR and `Setup validation`, including for admins; zero required approving reviews. Merge commits enabled; auto-merge and automatic branch deletion disabled. | Preserve supported controls, add permanent checks carefully, and distinguish owner-controlled release from second-person approval. Visibility changes affect available controls. |
| Actions access | Read-only default token permissions; the combined Actions PR creation/approval setting is disabled. Only Cloudflare deployment secret names are present; no Tina configuration was found. | Prepare an explicit configuration checklist for the release bot and editor. Do not infer permission to approve PRs from the setting's name. |
| Tooling | Pinned Node 24.21.0, pnpm 12.4.1, Astro 7.3.2, strict TypeScript, Tailwind Vite plugin, Prettier and Biome. | Extend the existing toolchain after verifying integration compatibility. Biome currently has no enabled rule preset; select meaningful lint rules. |
| Visitor checks | Existing three-browser coverage, four viewport widths, axe, keyboard, text resizing, no-JS, links, HTTP 404 and Lighthouse diagnostics. | Preserve useful coverage while replacing placeholder-specific and globally-noindex expectations. |

Evidence: [README](../README.md), [setup record](../SETUP.md), [package manifest](../package.json), [site content](../src/data/site.ts), [dummy workflow](../.github/workflows/dummy-preview.yml), [deployment guard](../scripts/preview-guard.ts), [primary-source capability research](research/workflow-feasibility-2026-09-15.md), and read-only GitHub API/public HTTP inspection on the prepared date. Remote account state is a dated observation, not a permanent guarantee.

Cloudflare account configuration, Tina account entitlements, real editor behaviour and Worker CPU usage were not accessible or demonstrated by this planning audit. Public HTTP responses establish content identity, not the underlying domain-to-Worker mapping.

## 3. Agreed decisions and design tree

The stack, Markdown-first model, broad editability, shared branch name, private preview, human publication decision and single release PR are settled by the staged intent.

| Round 1 question | User decision | Consequence |
| --- | --- | --- |
| **Q1: First milestone** | Working editing/review/release system first. | Use representative prototype content; defer company-content discovery and launch. |
| **Q2: Draft source privacy** | Public source is acceptable; only preview website access needs login. | Keep public visibility and existing enforceable Free-plan branch protections; use native draft release PRs. Feedback in public Issues must also be suitable for public exposure. |
| **Q3: Draft media privacy** | Upload only assets approved for public exposure. | Use ordinary repository media if its branch isolation is established; protected media storage is outside this milestone. |
| **Q4: Tina users** | One account shared by multiple people; Q9 establishes four people. | Record an explicit spec exception and verify service/account suitability for the four actual humans. |

| Round 2 question | User decision | Consequence |
| --- | --- | --- |
| **Q5: Repository default branch** | Make `development` default; release from `main`. | Ordinary Tina media can align with drafts; audit default PR bases, manual workflow availability and integrations before the change. |
| **Q6: Preview address and login** | `edit.leer.education`, individual allowlisted email-code logins. | Separate private Worker and per-person reviewer access. |
| **Q7: Release authority** | Only the originator initially. | Passing checks plus a deliberate owner merge; automation creates/reuses PRs only. |
| **Q8: Release proof destination** | Use the existing public placeholder for approved test releases. | Keep placeholder/noindex treatment through this milestone and prove the real domain's release path. |

**Q9 decision:** Four people will share Tina, typically one at a time. Simultaneous editing is not required, but overlapping attempts must be handled gracefully rather than silently overwriting work or breaking the system. The proposed mechanism and its evidence boundary are set out below. Provider seat interpretation and session behaviour remain deployment evidence to verify, not facts that can be assumed from one credential.

**Q10 confirmation:** The originator answered “Yes, this captures the plan,” confirming the complete plan, the single-editor approach and its explicit feasibility gates. The interview frontier is closed; account and runtime unknowns remain implementation evidence to collect.

```text
Confirmed intent and workflow
├── Q1 settled: Workflow first
│   └── Q8 settled: Approved releases to current public placeholder
├── Q2 settled: Public source accepted
│   └── Native draft PRs and enforced checks → Q7 settled: Originator releases
├── Q3 settled: Publicly exposable assets only
│   └── Q5 settled: development default; main releases
└── Q4 settled: Shared Tina login
    ├── Q9 settled: Four people; usually one editor; graceful overlap handling
    │   └── Agreed single-editor approach → early save/media feasibility proof
    ├── Service/account feasibility → verify before onboarding
    └── Q6 settled: Individual Access at edit.leer.education

Deployment evidence, collected during implementation
└── Tina/Astro/Cloudflare compatibility and free-tier measurements
    ├── Pass: continue the agreed design
    └── Fail: present evidence and alternatives for a new decision
```

The planning interview is complete. Detailed implementation mechanics are derived from these decisions and the specification rather than turning every field name into a user question. No external launch deadline has been supplied; this milestone uses acceptance gates rather than a promised date.

### Shared Tina account qualification

The user explicitly requested owner-authorised account sharing by **four people**. Reviewed Tina documentation neither establishes a blanket ban on that use nor confirms that those four humans sharing a login count as one Free-plan user. Do not promise unlimited editors from one login. Check the project's entitlement and supported authentication flow, and validate multi-browser login, expiry, recovery and session removal before onboarding. See the [research findings](research/workflow-feasibility-2026-09-15.md).

Treat edits as attributed to the shared identity, not reliably to an individual. Per-person Cloudflare Access revocation controls entry to this Worker; it does not by itself revoke someone who retains the shared Tina credentials from the separate Tina service. Document the required shared-credential/session recovery procedure. The account-sharing request does not extend to the originator's personal GitHub or Cloudflare credentials.

### Agreed overlap behaviour and technical proof

Use **one active editing session for the whole site**. Other people may continue reviewing and annotating; an attempt to edit shows that editing is occupied and offers to retry after handoff. A site-wide guard covers shared navigation/footer and media as well as pages, without introducing simultaneous document collaboration.

The selected approach to test uses a small SQLite-backed Cloudflare Durable Object to coordinate ownership atomically, keyed by the individual Access identity plus a browser-session token. This is shared state within the selected Cloudflare platform, not a paid collaboration subscription or always-on agent. Use HTTP requests/heartbeats; do not introduce WebSockets behind the selected Worker-level Access boundary. Include its real quotas/usage in the Free-plan proof. Do not implement acquisition through eventually consistent Workers KV or instance-local memory.

Tina's documented `ui.beforeSubmit` can asynchronously reject an ordinary form save, but it is a frontend hook and does not atomically fence TinaCloud's subsequent write. The default media path writes separately. A proxy through `contentApiUrlOverride` cannot be assumed to solve this: the inspected Tina source disables default cloud media in that configuration. See the [primary-source findings](research/workflow-feasibility-2026-09-15.md).

The early proof must therefore establish all of the following before claiming the guard works:

- A second normal browser cannot enter a writable session while another owns editing. Check ownership again on supported save and media operations; losing ownership produces a recoverable error rather than silently saving stale data.
- Preserve unsaved work when a session loses connectivity or ownership. Require explicit reconciliation/reload before an old form can save after handoff; give the user a way to retain their unsaved text.
- Exercise uploads/deletions and saves already in flight. Do not hand editing to a new session merely because a heartbeat expired while the previous write's outcome is unresolved.
- Provide explicit handoff and owner recovery after an abandoned browser, with clear instructions to resolve uncertain writes. Keep reviewer access independent of edit ownership.
- Test normal tabs, stale tabs, disconnected/reconnected browsers, a crash during save, duplicate submissions and two people contending for the slot. Also coordinate developer/schema changes and freeze edits for final release review.

The target is reliable protection against accidental overlap in this team's normal website workflow. It does not claim to constrain somebody deliberately writing through TinaCloud, GitHub or a modified client outside that workflow. If supported Tina hooks cannot meet the tested behaviour, present the failed case and the smallest alternatives for a new decision. Do not silently substitute an advisory warning, promise transaction guarantees, patch internal Tina APIs, add a paid plan or build a custom content/media backend under this plan.

## 4. Implementation sequence

### Phase 0 — Reconcile the specifications and audit setup

- Record the completed decision tree. Prepare reviewed corrections for the staged spec's existing-branch statement, no-shared-login rule, private-repository assumptions and company-content launch gate, reflecting this milestone's explicit decisions.
- Prepare the exact selected repository, Tina and Cloudflare configuration changes, including their impact on defaults and existing integrations. These account changes belong to future authorised implementation; do not re-open settled design choices merely because they require configuration.
- Inspect actual Cloudflare Worker/domain mappings and competing build integrations. Preserve the existing apex and `www` policy. Do not protect or repurpose `leer-preview` as the editor while it may serve the public domain.
- Inventory account owners, allowed identities, recovery ownership and secret names; establish actual free-plan/seat limits. Never record secret values.

**Exit:** The milestone decisions and account ownership/entitlements are recorded; the public serving topology is understood before mutations. Business-content questions are explicitly deferred. Requirements: Q-04–Q-07, O-01–O-03, A-24–A-25.

### Phase 1 — Establish the permanent source and validation baseline

- Use an isolated checkout for implementation so the current staged requirements and unrelated local work remain intact. Create or re-verify the designated `development` branch from an explicitly reviewed baseline based on `main`.
- Selectively carry forward the useful site skeleton, pinned dependencies, validation commands and artifact safeguards. Exclude the disposable workflow's deployment triggers, cleanup marker behaviour and placeholder-specific release assertions.
- Commit the accepted requirements and necessary setup additions through reviewed changes. Establish stable permanent check names without temporarily breaking the existing required `Setup validation` check. Introduce the baseline checks and minimal development-preview workflow needed for the next phase; keep public deployment disabled during bootstrap.
- Verify compatible released integration versions, lockfile resolutions and permitted dependency install scripts. Add a useful Biome rule baseline; keep Prettier as the formatter and retain Astro/type checks.
- Once the branch and baseline are ready, make `development` default and verify integrations, explicit release bases and workflow availability before connecting Tina/media. Do not depend on manual dispatch until its workflow exists on the default branch.

**Exit:** A fresh frozen install and baseline checks pass on the permanent source; neither branch creation nor bootstrap changes trigger unintended public deployment. Requirements: A-02–A-03, W-02–W-04.

### Phase 2 — Prove the risky editing integration on Cloudflare

- Add explicit editing and production build targets with clean separate output directories and validated target/branch combinations. Production reads only the checked-out source and media snapshot.
- Add a small representative Markdown fixture and Tina schema: a page, nested/reordered objects, a shared navigation/footer document, rich text, image/alt text and a link. Retain explicit prototype labels; these fixtures exercise the workflow rather than claim company facts.
- Integrate Tina's supported Astro metadata-aware queries, editable regions, nested bindings and unsaved HTML refresh. Keep Astro presentation; add no site-wide React hydration.
- Deploy the editing target through the trusted GitHub Actions preview path to a separate Worker protected as a whole by Access. Establish protection before serving draft/editor content. Test all domain/alternate entry points, Tina login, iframe/refresh behaviour, session expiry and revocation.
- Validate refresh inputs, registered regions, allowed origins, unsafe URLs and request-size limits. Prove private/no-store handling prevents one session's unsaved overlay from being served to another; inspect browser artifacts and test traces for credential exposure.
- Audit adapter-generated output and bindings. Disable unused sessions when supported; explicitly choose image handling. Provision any necessary persistent resources once and record quotas.
- Verify real development-only text saves, indexing delay, unsupported rich-text handling, production exclusions and renderer parity. Measure cold and representative complex refresh CPU/failures on the actual Free plan.
- Prove graceful overlapping edit attempts now: one active editor, a clear read-only/busy state for another, stale-session handling, recovery after tab/browser/network failure, and preservation of unsaved work. Include save-in-flight and media mutations in the design review; an entry-screen lock or advisory warning alone must not be described as preventing conflicting writes. Keep viewing/annotation available while editing is occupied.

**Exit:** A deployed technical proof demonstrates editing rather than merely compiling. If the required workflow does not fit the chosen versions or free plan, stop that dependent work and present measured options. Requirements: A-14–A-17, A-24; W-01–W-03, W-05–W-06.

### Phase 3 — Establish safe media persistence

- Configure ordinary Tina repository media and verify the selected default branch is now `development`; keep all production targets explicitly fixed to `main`.
- Test real uploads, replacements under new filenames, deletions and resulting commits. Confirm every write affects `development`, with no implicit fallback to `main`.
- Use repository-relative media references and release-checkout assets for production. Verify an unreleased upload/replacement/deletion cannot alter the currently deployed public release.
- Document that this workflow accepts only assets approved for public exposure. Filter production output to its published documents and approved/referenced assets, including copied raw files; a draft flag is not just a navigation filter.

**Exit:** The chosen privacy policy and branch isolation are demonstrated for every media operation. Requirements: A-04, A-16–A-17, A-24–A-25; specification section 4.3.

### Phase 4 — Migrate the site to the editorial contract

- Build an editability inventory mapping each maintained value/object to its Markdown document, Tina control, rendered component and contextual binding. Include header, footer, navigation, metadata and 404 content.
- Implement approved section types with bounded semantic layout controls and stable object IDs. Include the schema, labels/help, defaults, validation, renderer and bindings in each section's contract.
- Move substantial maintained copy out of `src/data/site.ts` and presentation components. Use prose Markdown bodies and typed frontmatter sections where appropriate; keep genuine shared content in singleton/reference documents.
- Implement one page routing/validation path: supported templates, unique routes, reserved paths, redirect handling, valid references/media, deletion errors and consistent draft exclusion.
- Test supported rich text round trips and equivalent local-snapshot/Tina rendering, preserving source metadata for contextual editing. Report unsupported constructs before migration.
- Use the existing prototype's hero, prose/introduction, feature cards and shared header/footer as the initial section set, plus a prose template to prove page creation. Expose image selection/alt text, links, repeated-item and section ordering, metadata, bounded themes/alignment/image placement/spacing and a decorative-art preset where appropriate. Keep arbitrary artwork/code changes in the annotation/developer workflow and record that boundary in the editability inventory.

**Exit:** A nontechnical editor can change/reorder the required content and create a valid page without source editing, with save/reopen preservation. Requirements: A-01, A-04, A-12–A-15; W-01, W-07.

### Phase 5 — Deliver the shared preview and release automation

- Implement permanent source checks, development preview deployment, the release-PR ensure job and production delivery, sharing jobs only where that keeps the workflow understandable.
- Carry forward exact tested-artifact deployment, digest/commit/target identity and scoped credentials. Run trusted development checks/preview from the push path rather than relying on bot-created PR events.
- Keep obsolete build cancellation separate from final deployment serialisation. Recheck branch/revision identity at deployment so stale queued/rerun jobs cannot overwrite newer releases.
- Make the ordinary protected review view render the Markdown/media snapshot packaged with its build. Keep Tina's live queries and unsaved overlays in the editing path, using the same renderer contract. Provide a clear return to the saved review view and display its revision so newer CMS content cannot masquerade as the reviewed build.
- Implement the specification's exact same-repository `development` → `main` PR contract, pause switch, ancestry-aware diff check and race recovery. Preserve existing PR title/body/discussion and fail visibly on ambiguous state.
- Use native draft PRs for the accepted public repository. Verify initial creation, repeated saves, races, empty/reverse diffs, post-release next batch, manual closure/pause, permission failure and absence of forbidden writes/approval/merge calls.
- Implement originator-controlled production provenance and failure reporting: verify the approved same-repository release PR, its merge into `main`, the intended commit and authorised human merger; reject an ordinary direct push as release authority. Use merge commits for the long-lived branch and preserve it after release. Include a maintainer-controlled normal merge of `main` back into `development` after releases and hotfixes, preserving unpublished work and satisfying the strict up-to-date requirement before the next release. The ensure-PR action never performs that source synchronisation.
- Add an explicit owner-only recovery dispatch that verifies and redeploys a previously approved production revision/artifact. It pauses ordinary production publication, shares production deployment serialisation and supersedes stale normal runs, but deliberately does not require the selected historical revision to equal current `main`. Verify its approval record/artifact identity; if the retained artifact has expired, rebuild the exact approved checkout and rerun required checks. Reconcile source history through reviewed normal merges before resuming ordinary publication, preserving unpublished `development` work. Test this exception and queued-run behaviour separately from normal-release guards.

**Exit:** Repeated editor/developer rounds feed one reviewed batch; only an approved release can reach production; failed/stale checks cannot publish. Exercise API logic with focused Node tests and a controlled repository test. Requirements: A-03, A-19–A-21; W-02–W-04.

### Phase 6 — Add the visual feedback and AI design workflow

- Install/configure Impeccable for the selected developer/agent environment. Accepted changes update real Markdown/schema/Astro source and preserve editor controls.
- Add Agentation as a private-only, isolated React integration with distinct editing and annotation modes. Confirm no editor/reviewer code enters the delivered production bundle.
- Add a GitHub Issue template and a documented browser copy/paste handoff, recording the page, viewport, selected text, stable section identity and known revision. Distinguish unsaved-overlay feedback.
- Test region replacement, navigation/reordering and stale annotations. Provide a screenshot-and-Issue fallback for phones and unsupported selections.

**Exit:** A nontechnical reviewer submits actionable feedback and reviews its implemented change through the shared workflow. Requirements: A-22–A-23; W-05, W-07.

### Phase 7 — Complete quality and operational acceptance

- Adapt the existing browser suite for both targets while retaining accessibility, responsive, keyboard, zoom, links, real 404 and no-JS coverage. Add focused content/renderer, editor-isolation, media and release tests where they verify substantive requirements.
- Test same-document and different-document saves in two browsers, stale schema sessions and AI/content overlap. Document the observed coordination limits and a brief freeze/reload procedure for schema changes and final release review.
- Verify public canonical/redirect behaviour, draft exclusion and approved assets, retaining noindex and disallowed crawling for the prototype. Keep the private target authenticated and non-indexable. Leave final-company sitemap/indexing and numerical performance budgets to the eventual approved design; retain mobile Lighthouse diagnostics now.
- Write distinct editor/reviewer and maintainer release/recovery runbooks; document exact commands, revision checks, account ownership, onboarding/offboarding, pause/recovery procedures and cost limits.
- Prepare the known-good production restore rehearsal and exercise broken editor/schema recovery without discarding ongoing drafts. Complete real mobile and manual accessibility review.
- Have a nontechnical teammate complete sign-in → edit → save → annotation → AI-change review. Finish human release observation and production restore acceptance in Phase 8 once the first real test release exists. A maintainer-only demonstration is not acceptance.

**Exit:** All pre-release checks and editor/reviewer acceptance have evidence; live release/restore checks are ready for Phase 8. A-01's final company content and the corresponding launch/indexing parts of A-09 are explicitly deferred; A-10 is satisfied by the absence of optional visitor forms/integrations.

### Phase 8 — Approved prototype releases and retirement

- Present the tested production artifact, reviewed source revision, clearly identified prototype content, verified domain/Worker change and recovery procedure for the originator's release decision.
- After the human release merge, deploy the intended `main` revision through the controlled path; verify the live commit/assets/404/canonical/redirect/noindex behaviour and retain rollback capability.
- With a nontechnical teammate observing, demonstrate that saving another content change affects only the private preview until the next human release; verify the next batch gets one new release PR. Exercise rollback of an approved test release, verify the restored public revision and preserve current draft work.
- Retire disposable resources only after verifying they no longer serve any required public hostname. The existing dummy cleanup script must not be run merely because a new editor exists.

**Exit:** The public placeholder now follows the human-controlled release path and is independently recoverable; the shared private editor supports the next batch. Requirements: A-03–A-11, A-20–A-21, with the prototype content/indexing exceptions above.

Final company-content discovery, a brand/design pass and release for search indexing form a separate follow-on milestone. They are not prerequisites for completing this system-first plan.

## 5. Expected repository changes

Paths below are proposed implementation locations; they are not files created by this planning task.

| Area | Expected files or changes |
| --- | --- |
| Requirements and operations | Reconcile `specs/intent.md` / `specs/spec.md` with the recorded decisions; rewrite `README.md` and `SETUP.md`; add concise editor/review and release/recovery runbooks under `docs/`. Keep historical prompts clearly labelled as historical. |
| Editorial definitions | `tina/config.ts`, small schema modules and committed `tina/tina-lock.json`; page/global Markdown under `content/pages/` and `content/globals/`; an editability inventory under `specs/`. |
| Rendering and routes | Common validated data adapters in `src/lib/content/`; section components in `src/components/sections/`; shared header/footer/404 migration; one route-generation implementation instead of hand-written Astro pages for each document. |
| Build boundaries and edit coordination | Extend `astro.config.mjs` and package scripts; explicit public/editing Wrangler configuration; target-specific output and asset assembly; private Tina admin/refresh, review UI and supported edit-ownership integration. Add one coordination Durable Object only with its verified Free-plan binding/migration and integration tests. |
| Delivery | `.github/workflows/checks.yml`, `preview.yml`, `ensure-release-pr.yml`, `production.yml`; small helpers for PR logic, build identity, deployment guards and smoke checks. Preserve useful setup/preflight checks. |
| Feedback | Private Agentation integration, a public-safe GitHub Issue template, and reviewed Impeccable configuration in the existing developer/agent setup. |
| Verification | Extend `tests/e2e/` and focused Node tests for the content/renderer and release contracts; target-isolation and authenticated-preview checks; retain meaningful pipeline failure tests. |

Document frozen install, local static/Tina development, formatting/lint/type/content checks, both builds, local Wrangler, browser tests and deployment/recovery commands. Keep deployment credentials out of installation/test jobs and private runtime credentials out of public artifacts.

## 6. Sequencing and verification rules

- Phase 2 is the early feasibility gate. Expand content only after the representative integration works on the actual runtime.
- Account entitlement for four humans sharing Tina and reliable single-editor save/media behaviour are independent gates; a working login or visible lock indicator does not establish either one by itself.
- Finalise the media policy/configuration before enabling editor uploads. Phase 3 can overlap source modelling, but its acceptance cannot be postponed until after routine team use.
- Begin release-action unit work once branch/visibility decisions settle; enable production publication only after its review and deployment boundaries are demonstrated.
- No implementation estimate or launch date is asserted before scope, account setup and the runtime proof are settled. Use milestone exits to expose uncertainty instead of concealing it in a single date.
- Planning validation consists of source/configuration inspection and cited capability research. No website build, test suite, deployment, account mutation or editing acceptance test has been run as part of preparing this plan.

## 7. Confirmation and handoff

The originator confirmed this plan in Q10, completing the planning deliverable. That confirmation does not instruct implementation or publish a test release. When implementation is requested, begin with Phase 0 and retain the recorded decisions; the staged intent/spec and this agreed decision record form the requirements baseline. Update conflicting spec statements through a reviewed documentation change rather than silently treating them as current requirements. Collect the stated feasibility evidence early and return with concrete options only if it reveals a conflict with the agreed plan.
