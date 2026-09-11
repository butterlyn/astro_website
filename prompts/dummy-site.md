Read specs/intent.md, specs/spec.md and SETUP.md.
Build a throwaway placeholder site on a new branch to prove the pipeline end to end. Do not touch main.
Allowed for this run only: placeholder content, no plan.md, noindex on every page, deploy from the branch via GitHub Actions to a preview Worker with a non-production name.
Everything else per the spec (section 3, R-07, R-08).
Include a manually triggered workflow job that deletes the preview Worker, for cleanup later.
Push, watch the Actions run with gh, verify the live URL with curl, then report the URL and anything skipped or failed, and stop.
When I later say "clean up": run the cleanup job, confirm the Worker is gone, and delete the branch locally and on GitHub.
