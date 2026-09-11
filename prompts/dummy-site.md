Read specs/intent.md, specs/spec.md and SETUP.md.
Build a throwaway placeholder site on a new branch to prove the pipeline end to end. Do not touch main.
Allowed for this run only: placeholder content, no plan.md, noindex on every page, deploy from the branch via GitHub Actions to a preview Worker with a non-production name.
Everything else per the spec (section 3, R-07, R-08).
Implement cleanup through a dedicated marker commit on the throwaway branch: an ordinary branch push runs build and deployment, while a push that adds `.cleanup-preview` runs only the preview Worker deletion job. Do not use `workflow_dispatch`, because no workflow is added to main.
Push, watch the Actions run with gh, verify the live URL with curl, then report the URL and anything skipped or failed, and stop.
When I later say "clean up": add and push `.cleanup-preview`, watch the cleanup job, confirm the Worker is gone, and delete the branch locally and on GitHub.
