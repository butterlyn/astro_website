# Editing and reviewing during the prototype

This runbook describes the implemented cooperative reservation. Hosted sign-in, media commits and team acceptance are still pending. See [Tina setup](tina-setup.md) and [implementation status](implementation-status.md).

Open [the protected editing page](https://edit.leer.education/edit/). If another person holds editing, continue reviewing the saved site or retry later. When available, choose **Reserve and load saved content**. Keep one editor tab open. Do not duplicate the editor tab: browser duplication can copy its session state.

Before handing over, finish saves/uploads and check their outcomes. Copy any unsaved text, confirm the handoff checkbox, then choose **Close editor and hand off**. The next person loads saved content into a fresh editor. Closing a browser or losing a heartbeat never automatically gives somebody else the reservation.

If connectivity or ownership is lost, the existing editor remains visible. Ordinary form saves check the originally opened reservation and reject a stale session; text remains in the form. Copy text directly or use **Download a copy of editor text** before reloading. The download contains visible input/rich-text fields and the last attempted form save, which may already have been saved. Inspect it before restoring. A full browser crash may lose text that never reached a save attempt or export.

The originator accepted the following limitation on 15 September 2026: this is cooperative coordination, not an atomic Tina write gateway. Media operations and document deletion do not run the normal form hook. An already-issued save can complete after a later check or handoff. Uncertain writes and stale tabs may require manual recovery. Do not use Tina/GitHub directly around an occupied reservation.

For abandoned editing, `admin@leer.education` coordinates with the previous editor, stops outstanding saves/uploads, and compares saved GitHub content and Tina's indexed state. Export recoverable text before recovery. **Recover abandoned editing and pause** invalidates old forms and keeps editing frozen. After reconciling uncertain writes, choose **Resume after reconciliation**, then load saved content again. Recovery does not undo Git commits or upstream media operations.

Before developer/schema changes or final release review, agree on an editing freeze, reconcile outstanding writes, and choose **Pause for developer work or release review**. Check the saved preview's revision against the source being reviewed. Resume only after matching content, schema and components are ready; editors reload rather than reuse old forms.

The ordinary `/` review view uses the saved placeholder packaged in the build. `/editing-proof/` deliberately uses the live/local Tina query path; unsaved overlays are not a reviewed release snapshot. Full page migration, revision UI and Agentation are later gated implementation work.
