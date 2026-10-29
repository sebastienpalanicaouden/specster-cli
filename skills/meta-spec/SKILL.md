---
name: meta-spec
description: "Write a User Story's meta-spec from its Interview, or its next version from a one-sentence change request, and add it to Specster as a Spec Version."
disable-model-invocation: true
---

A **meta-spec** is a functional spec that contains a mockup: one HTML document the client reads and tries, kept in Specster as a Spec Version. Write one for the User Story named first in the arguments (`US-n` or its address). A sentence after it is a **change request**: the meta-spec's next version, changed only where the request reaches.

Run the CLI as [`../cli.md`](../cli.md) says. What a meta-spec holds, and what Specster's preview allows, is in [`FORMAT.md`](FORMAT.md).

1. **Load the User Story**: `specster load <US-n>`. It prints the sentence, the Interview and the Current Spec Version, if any. Done when they are in the conversation.
2. **Settle the content.**
   - Without a change request: every decision of the Interview.
   - With one: the Current Spec Version, unchanged except where the request reaches. When the request leaves a choice open, such as « une autre couleur » naming no colour, ask the User, offering two or three options that suit the page; when it is clear, ask nothing.

   Done when every rule, state and mockup detail traces back to the Interview or to the request.
3. **Write the draft** to a file in a temporary folder outside the repo (`mktemp -d`), named after the User Story, such as `US-2.html`, and open it in the User's browser (`open` on macOS, `xdg-open` on Linux). With a change request, add its line to the « Versions » section. Done when the draft opens in the browser.
4. **Get the User's approval**: ask them to try the draft, and correct the file until they approve it. Done when they approve.
5. **Send it**: `specster spec-version add <US-n> < <draft>`, then delete the temporary folder. Done when the CLI prints « US-n vN ajoutée : c'est la Version courante. » and the folder is gone.
6. **Report** to the User, in French: the new version, written « US-n vN », which the User Story's page in Specster now previews.
