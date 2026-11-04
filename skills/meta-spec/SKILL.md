---
name: meta-spec
description: "Write a Release's meta-spec from its Interview, or its next version after a change of its group or from a one-sentence change request, and add it to Specster as a Spec Version."
disable-model-invocation: true
---

A **meta-spec** is a functional spec that contains a mockup: one HTML document the client reads and tries, kept in Specster as a Spec Version of a Release. Write one for the Release named first in the arguments (`R-n` or its address). Given `US-n` or a User Story's address, propose its Release, or to create one, as the first step says.

Two things call for the meta-spec's next version, changed only where they reach:

- A sentence after the Release is a **change request**.
- A **group change** is what `specster load` prints last, while the group differs from what the Current Spec Version covers, such as « Le groupe a changé depuis v1 : US-8 ajoutée, US-5 retirée. Ajoutez une version de spec pour qu'elle couvre le groupe actuel. ».

Run the CLI as [`../cli.md`](../cli.md) says. What a meta-spec holds, and what Specster's preview allows, is in [`FORMAT.md`](FORMAT.md).

1. **Confirm the Release**, as [`../confirm-release.md`](../confirm-release.md) says, the need being what the Interview and the conversation are about. The load prints its User Stories with their sentences and Notes, its Interview, and the Current Spec Version, if any, with the User Stories it covers. Done when that file's criterion is met and all of this is in the conversation.
2. **Complete the Interview**, on a group change that adds a User Story. For each one added that the Interview doesn't cover yet, ask the User the questions its need raises, then send them with their answers, written as the transcript of [`../interview/SKILL.md`](../interview/SKILL.md): `specster interview add <R-n>`, on the standard input. Done when the Interview covers every User Story added, or none was added.
3. **Settle the content.**
   - Without a change request or a group change: every decision of the Interview.
   - With either: the Current Spec Version, unchanged except where they reach. A User Story added brings its rules from the Interview; one removed takes out those only it needed. When a change request leaves a choice open, such as « une autre couleur » naming no colour, ask the User, offering two or three options that suit the page; when it is clear, ask nothing.

   Done when every rule, state and mockup detail traces back to the Interview, the change request or the group change.
4. **Write the draft** to a file in a temporary folder outside the repo (`mktemp -d`), named after the Release, such as `R-2.html`, and open it in the User's browser (`open` on macOS, `xdg-open` on Linux). With a change request or a group change, add its line to the « Versions » section. Done when the draft opens in the browser.
5. **Get the User's approval**: ask them to try the draft, and correct the file until they approve it. Done when they approve.
6. **Send it**: `specster spec-version add <R-n> < <draft>`, then delete the temporary folder. Done when the CLI prints « R-n vN ajoutée : c'est la Version courante. » and the folder is gone.
7. **Update the tickets**, after a group change: in the repo's issue tracker, have each existing ticket citing « Meta-spec : R-n » cite the new version instead (check each citation is R-n itself, not R-n0). Done when no ticket cites an earlier version of it, or none exists yet.
8. **Report** to the User, in French: the new version, written « R-n vN », which the Release's page in Specster now previews, and the tickets updated, if any.
