# What a meta-spec holds

One self-contained HTML file in UTF-8, at most 5 MB: styles and scripts inline, https resources allowed, such as a web font. Written in French, for the client: plain words, no code or file names.

Its sections, in order:

1. **The header**: the feature's name, the date, and a short introduction saying the need in plain words.
2. **Essayez**: the mockup. The screen the feature lives on, reproduced in the app's own look (its colours, fonts and components, read from the codebase), where only the new feature works; a caption says what to try. Controls that belong to the mockup itself, such as « Simuler un échec », sit in a separate box labelled as not part of the feature.
3. **Comportement**: the rules, one per item, each a sentence the client can check.
4. **Les états**: a board showing every state of the feature side by side (idle, hover, keyboard focus, success, failure…), each with a caption.
5. **Hors périmètre**: what the feature leaves as it is.
6. **Versions**: one line per version, newest first. The first reads « Première version, écrite à partir de l'interview. »; a change request adds « Depuis vN : <what changed> », vN being the version it was made from. Specster numbers versions itself and never reuses a deleted one's number, so a line names the version it starts from, never its own.

## Specster's preview

The User Story's page shows the meta-spec in an iframe sandboxed with scripts only: the preview has no cookies, no `localStorage` or `sessionStorage` (they throw), no clipboard, no pop-ups and no navigation of the page around it. A mockup that needs one of these simulates it, such as showing the success state on click instead of really copying. The draft opened from a file can do more than the preview: check it against these limits, not against what works locally.

The PDF download prints the page as it loads, so the mockup's first state reads well on paper.
