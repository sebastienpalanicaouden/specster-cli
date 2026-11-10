---
name: load
description: "Load a Release from Specster into the conversation, by R-n or by US-n: its User Stories, its Interview and one of its Spec Versions."
disable-model-invocation: true
---

Load into this conversation, from Specster, what the arguments name, then optionally a version `vN`:

- **`R-n` or a Release's address**: the Release, with its User Stories, their sentences and Notes, the tasks linked to them, its Interview and one of its Spec Versions: the Current Spec Version unless a version is given.
- **`US-n` or a User Story's address**, as older specs and tickets cite it: the same, for the Release it is in. In no Release, it has only its sentence, its Notes and its tasks, and asking it for a version is refused.

Run the CLI as [`../cli.md`](../cli.md) says.

1. **Load**: `specster load <arguments>`. Its Markdown output stays in the conversation as the source of truth for what comes next, such as writing a meta-spec, `/to-spec` or `/implement`; nothing is written to disk. Done when the CLI has printed the Release, or the User Story in no Release.
2. **Report** to the User, in French, in a few lines:
   - For a Release: its title, the sentence of each User Story, how many Interview Entries were loaded, and which Spec Version, written « R-n vN ». That is the exact reference specs and tickets cite: a Spec Version never changes, while the Current Spec Version can. Repeat « Le groupe a changé depuis vN : … » when the output ends with it.
   - For a User Story in no Release: its sentence, and that it has neither an Interview nor a Spec Version until it is in a Release.
