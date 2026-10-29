---
name: load
description: "Load a User Story's Interview and one of its Spec Versions from Specster into the conversation."
disable-model-invocation: true
---

Load into this conversation, from Specster, the User Story named in the arguments (`US-n` or its address, then optionally a version `vN`), with its Interview and one of its Spec Versions: the Current Spec Version unless a version is given.

Run the CLI as [`../cli.md`](../cli.md) says.

1. **Load**: `specster load <arguments>`. Its Markdown output stays in the conversation as the source of truth for what comes next, such as writing a meta-spec, `/to-spec` or `/implement`; nothing is written to disk. Done when the CLI has printed the User Story.
2. **Report** to the User, in French, in a few lines: the sentence, how many Interview Entries were loaded, and which Spec Version, written « US-n vN ». That is the exact reference specs and tickets cite: a Spec Version never changes, while the Current Spec Version can.
