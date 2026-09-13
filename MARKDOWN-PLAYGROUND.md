# Markdown editing playground

This is the reusable content baseline for later CMS trials. No CMS has been
installed, selected, or adopted. The L.E.E.R. homepage keeps its existing copy,
colours, layout and artwork. New prose is visibly labelled sample content.

## Start here

The trial is in a separate worktree, on `trial/markdown-baseline`:

```bash
cd /mnt/c/Users/Butte/Documents/Coding/astro_website-markdown-baseline
```

**One-time administrator setup (already completed here):**

```bash
nvm use
pnpm install --frozen-lockfile
```

This uses the existing Node 24.21.0, pnpm 12.4.1 and Astro 7.3.2 pins. No account
login, secret, subscription, new dependency or remote permission is needed.

**Routine editing:** open this worktree in VS Code (`code .`), start the server,
and keep it running while you save Markdown:

```bash
pnpm dev --host 127.0.0.1 --port 4321
```

Open <http://localhost:4321/>. If a server is already running at that address,
use it instead of starting another. Check the terminal's URL if the port is busy.
The agent's automatic background launch hit Astro's 30-second startup timeout
on this machine; launching in the foreground succeeded. Use the foreground
command above in your own terminal and allow it to finish starting.

| Markdown source                     | Preview URL                                 | What it controls                                                                           |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/content/homepage/home.md`      | <http://localhost:4321/>                    | Homepage headline, summary, image/alt/caption, CTA, about section and three existing cards |
| `src/content/pages/sample-guide.md` | <http://localhost:4321/pages/sample-guide/> | Page title, summary and formatted prose                                                    |
| Every `src/content/pages/*.md`      | <http://localhost:4321/pages/>              | Automatically listed sample pages, sorted by title                                         |

## Your walkthrough

1. Open `src/content/homepage/home.md`. Change `headline` between the `---`
   delimiters, save, and look at the homepage. Try your own wording. Keep quotes
   around frontmatter text containing punctuation such as `:` or `#`.
2. Open `src/content/pages/sample-guide.md`. Below the second `---`, edit a
   paragraph, a `##` heading, **bold** or _italic_ text, a list item and the link.
   Save and view the sample guide. The frontmatter title supplies the page's H1;
   start body headings at `##`.
3. Create `src/content/pages/my-sample.md` with the following starting content,
   then change it yourself:

   ```markdown
   ---
   title: "My sample page"
   summary: "Sample content for my editing trial."
   ---

   ## A first note

   This is **sample prose** that I can edit.

   - One idea to explore.
   - Another idea to revisit.

   Return to [the homepage](/).
   ```

   Save, then open <http://localhost:4321/pages/my-sample/> and the sample-page
   list. No new route component or navigation edit is needed. Use unique,
   lowercase filenames with hyphens, directly inside `src/content/pages/`.
   The filename controls the URL; omit a `slug` field. Renaming a file changes
   its URL, so update any links to it.

4. For the image exercise, change `image` in `home.md` to
   `/images/preview-mark.svg` and update `imageAlt` to describe the site mark.
   The original is `/images/preview-artwork.svg`. Both files are in
   `public/images/` and can be saved/downloaded for later CMS upload exercises:
   [original artwork](http://localhost:4321/images/preview-artwork.svg) and
   [site mark](http://localhost:4321/images/preview-mark.svg).

These are reusable SVG images made from the existing CSS artwork and favicon,
not new company imagery. Uploaded files should go in `public/images/`, with
Markdown referencing `/images/filename` (omit `public`). Images use a fixed,
responsive frame and may be cropped. SVG upload support depends on each real
CMS and has not been trialled here.

This baseline exercise intentionally uses Markdown files. Later CMS trials
should expose these fields and prose through the real editor, so stakeholders
can edit and add pages without opening source files.

## Saves, previews and access

Saving writes to this worktree's files. Astro watches those files and refreshes
the local preview; if it appears stale, refresh the browser. Restart the server
after changing the schema, or if your WSL filesystem misses a file event.
Frontmatter errors appear in the terminal/browser and must be corrected.
There is no separate draft/publish flag: every valid page document is included.

Saves remain uncommitted until you explicitly commit them. They do not push to
GitHub or update Cloudflare. Do not edit generated `.astro/` or `dist/` files.
To rebuild a static snapshot, run `pnpm build`; an already-built preview only
changes after another build. The inherited local Cloudflare command remains
`pnpm preview:cloudflare` at <http://127.0.0.1:8787/> after building.

The running development preview is **local-only**, bound to loopback. Open it
from this computer (including the Windows browser through WSL localhost
forwarding). Sending its localhost URL to someone else does not give them
access. Remote stakeholder access to this baseline is not configured.

The inherited GitHub Actions deployment to Cloudflare is unchanged. Only
`dummy/pipeline-proof-20260912` deploys to the existing preview at
<https://leer-preview.butterlyn.workers.dev/>; that URL is not this Markdown
baseline. Pushing this trial branch would not deploy it. No remote setup or
production change was made. A hosted CMS trial will need its own explicitly
configured preview through GitHub Actions, or reuse of the existing preview.

## Clean starting point for every CMS

The local tag **`trial/markdown-baseline-v1`** records the clean Markdown
baseline. It was created from the original `9e7b2d1` revision, before any CMS.
Keep the tag fixed even if you commit your editing experiments on the branch.
The original `astro_website` worktree is preserved.

Administrator commands for two independent future trials (examples only;
these CMS integrations have not been installed):

```bash
cd /mnt/c/Users/Butte/Documents/Coding/astro_website
git rev-parse trial/markdown-baseline-v1
git worktree add -b trial/cms-a ../astro_website-cms-a trial/markdown-baseline-v1
git worktree add -b trial/cms-b ../astro_website-cms-b trial/markdown-baseline-v1
```

Install with `pnpm install --frozen-lockfile` in each worktree. Use different
local ports if running multiple trials. Both start from the same Markdown
revision, never from another CMS branch. No migration needs to be repeated.

The small schemas live in `src/content.config.ts`: homepage metadata plus
Markdown for the about prose, and `title`/`summary` plus Markdown for each content
page. `HomePage.astro` and `ContentPage.astro` reuse `Page.astro` for the shared
design. `src/pages/pages/[id].astro` generates the content routes. This follows
Astro's current [content collections documentation](https://docs.astro.build/en/guides/content-collections/)
using the installed version's `glob()`, `getEntry()`, `getCollection()` and
`render()` APIs.

Handover checks covered the frozen install, type checking, lint/format checks,
static build and initial browser loads of the three playground URLs and both
images. No editing scenarios or CMS evaluation suite were run.

## Stop, restart and remove

Stop a server you launched with **Ctrl+C** in its terminal. Restart with the
same `pnpm dev --host 127.0.0.1 --port 4321` command from this worktree.

Astro 7 also provides commands for the server started during this setup:

```bash
pnpm dev status
pnpm dev stop
```

These commands are scoped to this worktree. See Astro's
[server commands](https://docs.astro.build/en/reference/cli-reference/#common-subcommands)
for the built-in lifecycle controls.

To remove the trial, first stop its server and preserve any edits you want to
keep. Then, from the original worktree:

```bash
cd /mnt/c/Users/Butte/Documents/Coding/astro_website
git -C ../astro_website-markdown-baseline status --short
# Continue only after saving any wanted edits elsewhere or committing them.
git worktree remove ../astro_website-markdown-baseline
git branch -D trial/markdown-baseline
```

Worktree removal refuses uncommitted edits; do not force it. It may also ask you
to remove ignored generated files such as `node_modules/`, `.astro/` or `dist/`
before retrying. Keep `trial/markdown-baseline-v1` to reuse the baseline. Once
all trials are finished, optionally remove that local tag with
`git tag -d trial/markdown-baseline-v1`. These commands remove only the local
trial; they do not invoke the original preview's Cloudflare cleanup workflow.
