# Intent: Startup company website

**Status:** Draft for originator review.  
**Source:** The originator's website-planning conversation.  
**Companion document:** `spec.md` contains the proposed requirements and technical design.

## Problem and context

I have been asked to create a company website for a startup. I am very familiar with Python development, but I have no web development experience.

I intend to use AI to do the coding. I want to understand and oversee the architectural decisions rather than delegate those decisions without understanding their consequences.

## Desired outcomes

- **I-01 — Company website:** Create the startup's company website. The company's identity, audience, messaging, and required pages still need to be supplied.
- **I-02 — Architectural oversight:** Use AI for implementation while keeping me informed about, and in control of, architectural choices and trade-offs.
- **I-03 — Mobile usability:** The website should work well on mobile phones as well as desktop browsers.

## Confirmed choices and constraints

- **C-01 — GitHub:** Keep the website project in GitHub.
- **C-02 — Deployment:** Use GitHub Actions to deploy the website to Cloudflare.
- **C-03 — Package management:** Use pnpm rather than Bun for this website specifically.

## Preferences and considerations

I am interested in modern, well-regarded tools, similar in spirit to the Python tools I already appreciate: uv, Ruff, and Polars. Community experience, including developer discussions on Reddit, matters to me when evaluating choices.

I have explored Markdown-to-website approaches and low/no-code alternatives such as WordPress and Framer. I want to understand the trade-offs in cost, complexity, content editing, and ongoing ownership. Exploring those alternatives does not establish a requirement to use Markdown, a CMS, or a visual editor.

Astro has been the main framework discussed, but the proposed framework and supporting tools belong in `spec.md`; they should not be presented here as requirements I originally specified.

## Affected people and systems

The website's visitors, the startup, and me as the person responsible for building it are affected. Future content editors and maintenance responsibilities have not been identified. GitHub, GitHub Actions, and Cloudflare are the intended delivery systems.

## Open questions

- **Q-01 — Business:** What is the company, who is the intended audience, and what should visitors understand or do?
- **Q-02 — Scope:** Which pages, content types, and features are needed? Are contact forms, a blog, pricing, or other integrations actually required?
- **Q-03 — Design and content:** What branding, copy, images, and design references are available, and who approves them?
- **Q-04 — Ownership:** Who will edit and maintain the website after launch? Do they need browser-based editing or independent control of page layouts?
- **Q-05 — Delivery:** What domain and accounts will be used, and who controls production access and launch approval?
- **Q-06 — Commercial constraints:** What are the budget, launch deadline, and expected traffic or content scale?
- **Q-07 — Policies:** What company requirements apply to privacy, security, accessibility, analytics, and any visitor data collection?

## Scope boundary

This request concerns a company website. Requirements for a customer application, authentication, payments, e-commerce, or a native mobile app have not been established.

Technical recommendations, detailed acceptance criteria, and assumptions used to proceed belong in `spec.md`. Unanswered business questions should remain explicit rather than be filled with invented company details.
