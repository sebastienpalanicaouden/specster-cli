---
name: interview
description: "Save the grilling that just ended, word for word, as the next Entry of a Release's Interview in Specster."
disable-model-invocation: true
---

Save this conversation's grilling, word for word, as the next Interview Entry of the Release named in the arguments: `R-n`, or the Release's address. Given `US-n` or a User Story's address, propose its Release, or to create one, as the first step says. An Entry is never modified once added, and only goes with its Release: get the Release right before sending.

Run the CLI as [`../cli.md`](../cli.md) says.

1. **Confirm the Release**, as [`../confirm-release.md`](../confirm-release.md) says, the need being what the grilling was about. Done when that file's criterion is met.
2. **Write the transcript**: every question of the grilling, in the order asked, each followed by the User's answer, in Markdown:

   ```md
   **Question :** <the question, as asked, with the options offered if any>

   **Réponse :** <the User's answer, as typed: the option chosen and any note added>
   ```

   The transcript is verbatim: questions as you asked them, answers in the User's own words, typos included. Done when every question of the grilling is there with its answer, none merged or summarised.
3. **Send it**: `specster interview add <R-n>`, the transcript on the standard input. Done when the CLI prints « Ajout enregistré dans l'interview de R-n. »
4. **Report** to the User, in French: the Release and how many questions were saved. When the grilling changed the need a sentence states, say so: the User changes the sentence by hand, on the User Story's page in Specster. When the load ended with « Le groupe a changé depuis vN : … », add that `/specster:meta-spec R-n` writes the version that covers the group.
