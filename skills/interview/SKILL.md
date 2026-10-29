---
name: interview
description: "Save the grilling that just ended, word for word, as the next Entry of a User Story's Interview in Specster."
disable-model-invocation: true
---

Save this conversation's grilling, word for word, as the next Interview Entry of the User Story named in the arguments: `US-n`, or the User Story's address. An Entry is never modified once added, and only goes with its User Story: get the User Story right before sending.

Run the CLI as [`../cli.md`](../cli.md) says.

1. **Confirm the User Story.** Run `specster load <US-n>` and read its sentence. When the grilling is about another need, ask the User which User Story they mean. Done when the sentence matches what the grilling was about.
2. **Write the transcript**: every question of the grilling, in the order asked, each followed by the User's answer, in Markdown:

   ```md
   **Question :** <the question, as asked, with the options offered if any>

   **Réponse :** <the User's answer, as typed: the option chosen and any note added>
   ```

   The transcript is verbatim: questions as you asked them, answers in the User's own words, typos included. Done when every question of the grilling is there with its answer, none merged or summarised.
3. **Send it**: `specster interview add <US-n>`, the transcript on the standard input. Done when the CLI prints « Ajout enregistré dans l'interview de US-n. »
4. **Report** to the User, in French: the User Story and how many questions were saved. When the grilling changed the need the sentence states, say so: the User changes the sentence by hand, on the User Story's page in Specster.
