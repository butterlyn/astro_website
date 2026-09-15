# Intent: LEER company website

**Status:** Consolidated statement of the originator's intent and confirmed decisions; updated for review.  
**Updated:** 15 September 2026.  
**Source:** The website-planning conversation, including the latest approval of release-PR automation.  
**Companion:** [spec.md](./spec.md) contains the requirements, recommended implementation, risks, and verification criteria. This document does not assert that those capabilities have been implemented.

## 1. Context and purpose

I have been asked to create a company website for a startup. I am very familiar with modern Python development, but I have no prior web-development experience. I intend to use AI for coding while understanding and retaining control of architectural decisions.

The website needs to be maintainable by a small team, not just by me. Nontechnical project members can navigate GitHub's website, but cannot write code or operate Git. They should be able to make routine changes graphically and describe more complex changes visually for AI-assisted implementation.

I prefer modern, well-regarded tools, similar in spirit to uv, Ruff, and Polars. Community experience matters, but the practical editing workflow and ongoing cost matter more than adopting a tool merely because it is fashionable.

## 2. Desired outcomes

- **I-01 — Company website:** Deliver the company's public website using approved messaging, design, and content. Do not invent business claims or a page inventory from examples used during planning.
- **I-02 — Architectural oversight:** Let AI do implementation work while keeping me informed about, and in control of, the architecture and its trade-offs.
- **I-03 — Mobile usability:** Make the website work well on mobile phones as well as larger screens.
- **I-04 — Graphical editing:** Allow nontechnical teammates to edit website content through a browser GUI without writing code, Markdown syntax, or Git commands.
- **I-05 — Maximum practical editability:** Design the website around Tina editing from the outset. Expose the text, media, links, objects, and page composition the team needs to maintain, rather than making only a small subset editable.
- **I-06 — Visual change requests:** Provide an interface for annotating requested changes that are difficult or impossible to make through the content editor, so they can be implemented with AI assistance.
- **I-07 — Private review before publication:** Give the team a shared private preview of content and developer changes. Saving work must not immediately publish it to the general public.
- **I-08 — Low ongoing cost:** Aim for ideally $0 recurring website-platform cost. In particular, the preview and release workflow should not require an ongoing paid Tina subscription. Any unavoidable costs or free-tier limitations must be made explicit rather than hidden.
- **I-09 — Convenient, non-duplicating release preparation:** Automatically maintain a release pull request without creating a separate or competing PR for every save or editing round. Keep the decision to publish under human control.

## 3. Confirmed stack and delivery choices

| ID | Confirmed choice |
| --- | --- |
| **C-01** | Keep the website project in **GitHub**. |
| **C-02** | Use **GitHub Actions** to deploy to **Cloudflare**. |
| **C-03** | Use **pnpm**, not Bun, for this website specifically. |
| **C-04** | Use **Astro** as the website framework. |
| **C-05** | Use **Markdown as the primary content format**, with an authoring model similar in spirit to MkDocs. This applies to the website's content generally, not just a possible blog. |
| **C-06** | Use **Tina** for graphical content editing. I personally compared Pages CMS, Sveltia, and Tina and chose Tina. |
| **C-07** | Add **Impeccable** to the AI-assisted development/design workflow. |
| **C-08** | Add **Agentation** for visual annotations and change requests. |
| **C-09** | Establish and use **`development`** as the repository default and shared draft/integration branch for both Tina content edits and developer/AI changes, including Impeccable-assisted changes. |
| **C-10** | Use **`main`** for approved public releases. The shared private preview follows `development`; publication follows an explicit human-controlled release into `main`. |
| **C-11** | Include an automatic action that ensures **at most one open `development` → `main` release PR** and reuses it across editing rounds. It must not approve or merge the PR or modify the branch contents. |

Astro, Markdown, Tina, Impeccable, and Agentation are now selected, not merely alternatives under evaluation. Detailed choices such as content schemas, authentication configuration, CI implementation, and supporting quality tools remain in `spec.md`.

## 4. Editing and collaboration expectations

Routine editing should be as direct as practical: open the website editor, find the relevant page or shared content, make a change, preview it, and save. Content should remain in the repository rather than become trapped in an unrelated publishing system.

The initial Tina trial left too much text and too many objects uneditable. I want the implementation to address that limitation through the website architecture and content model. Changes outside the editor's supported controls should have a clear annotation-to-AI path rather than requiring nontechnical teammates to edit source code.

The team is small. I accept coordinating work on the shared preview, especially when people might edit the same content. I also accept that a shared branch collects a batch of changes that will normally be released together. I am not asking for an expensive independent-preview environment for every editor or change.

Developer and content work should converge in the same preview. I do not want a content-only draft environment that cannot show the matching component or design changes.

## 5. Release workflow expectations

Saving a Tina edit, pushing developer work, or opening a release PR must not itself publish the website.

The first unreleased changes should cause a release PR to be opened automatically. Further editing rounds should accumulate in that existing PR, preserving the team's discussion and review. Once the release is merged, the next batch of changes may get a new PR.

The automation is for preparing and maintaining the review opportunity, not for approving the work. It must avoid duplicate/clashing release PRs, including when multiple saves arrive close together. It must not reset `development`, overwrite contributors' work, or force publication.

The team reviews the shared preview and decides when the batch is ready. A successful approved production deployment is the point at which the public site changes.

## 6. Cost and ownership preferences

The main reason for choosing the fixed shared `development` workflow is to obtain previews without paying for Tina's ongoing editorial/branching features. Prefer free tools and free tiers, and avoid unnecessary hosted services or always-running infrastructure.

The $0 goal is a preference to design and verify against, not an assertion that domains, AI usage, labour, or every possible level of traffic will be free. Surface any conflict between cost, privacy, number of editors, and the required editing experience before introducing a paid dependency or reducing an agreed capability.

The website should remain understandable and maintainable through its source, documentation, and review history. Do not silently replace the selected tools or weaken the release workflow to simplify implementation.

## 7. Remaining business and operational questions

| ID | What still needs to be established |
| --- | --- |
| **Q-01 — Business** | Approved audience, messaging, offering, factual company details, and the action visitors should take. |
| **Q-02 — Scope** | Actual pages and content types, and whether forms, a blog, pricing, analytics, or other integrations are needed. Examples in the conversation do not authorise those features. |
| **Q-03 — Design and content** | Approved brand assets, copy, images, design references, and the people who approve them. |
| **Q-04 — People** | Named editors, preview-only reviewers, maintainers, and release approvers; the number of people who need Tina accounts. The need for nontechnical editing is already settled. |
| **Q-05 — Accounts and access** | Existing repository/account configuration, the private editor's hostname, allowed identities, production permissions, and recovery ownership. Preserve established domain settings unless a change is approved. |
| **Q-06 — Capacity and timing** | Launch timing, expected traffic/content scale, actual free-tier suitability, and the treatment of any unavoidable non-platform costs. The low-cost preference is already settled. |
| **Q-07 — Policies** | Company privacy, security, accessibility, analytics, and data-handling policies; whether unpublished media itself must remain confidential. |

## 8. Scope boundary

This is a company website with a private team editing/review workflow, not the startup's product application. Visitor accounts, payments, e-commerce, dashboards, databases for customer records, native apps, and offline/PWA functionality are not established requirements.

The private editor does need access control. That does not imply adding authentication to the public visitor experience.

Technical recommendations, precise limits, layout controls, implementation details, and acceptance tests belong in [spec.md](./spec.md). Changes to my confirmed choices or intended outcomes require an explicit intent revision.

## 8. Confirmed implementation milestone (15 September 2026)

The agreed [migration plan](plan.md) records Q1–Q10. Implement the editing/review/release system first with representative, explicitly labelled placeholder content and noindex. Final company content, design and search launch are a later milestone. Approved test releases may update the existing public placeholder at `leer.education`; each still requires the originator's deliberate release decision.

Keep the repository public: draft source and uploaded media must be suitable for public exposure. Make `development` the default branch and sole Tina/media draft destination. Protect all of `edit.leer.education` with individual allowlisted email-code logins. Only the originator may publish initially.

Four people will share an owner-authorised Tina identity, normally one editor at a time, subject to verifying the service entitlement and authentication behaviour. One site-wide editing session must cover ordinary saves and media writes, preserve unsaved work after interruption, and prevent unsafe handoff while a write has an uncertain outcome. The plan's early feasibility gate applies; do not replace it with an advisory lock or custom backend without a new decision.

Implementation clarification: after the pinned Tina save/media tests, I accept a cooperative editing reservation with explicit handoff. Stale or uncertain writes may require manual recovery. `admin@leer.education` is the initial individual Access and recovery identity. TinaCloud setup guidance is required before the hosted proof.
