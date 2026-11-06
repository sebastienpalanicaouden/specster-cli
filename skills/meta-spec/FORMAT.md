# What a meta-spec holds

One self-contained HTML file in UTF-8, at most 5 MB: styles and scripts inline, https resources allowed, such as a web font. Written in French, for the client: plain words, no code or file names.

A **screen** is anything a user of the product sees: a page, a dialog, an e-mail, a PDF. The output of a CLI or an API is one only when that user sees it. A screen is **touched** when the Release changes its look: because one of its features is used on it, or as a side effect, such as through a shared component.

Its sections, in order:

1. **The header**: the feature's name, the date, and a short introduction saying the need in plain words.
2. **Écrans touchés**: a sentence saying that each mockup reproduces the whole screen to place it, but that only what its line describes changes, the real app being authoritative for the rest; then one line per touched screen: its name, the User Stories it serves or « par effet de bord de US-n », what changes on it in one sentence, and a link to its mockup. A User Story that changes no screen is named under the list, with a pointer to « Comportement » for its rules. With no screen touched, the section reads « Aucun écran ne change. ».
3. **Essayez**: one interactive mockup per screen a feature of the Release is used on, where only the new features work, each titled with the screen's name and the User Stories it serves. Its caption repeats its line of « Écrans touchés » and says what to try. Controls that belong to the mockup itself, such as « Simuler un échec », sit in a separate box labelled as not part of the feature.
4. **Autres écrans**: a still mockup of each screen touched as a side effect, with no interaction, in the order of the list, with its line as its caption.
5. **Comportement**: the rules, one per item, each a sentence the client can check.
6. **Les états**: a board showing every state of the features side by side (idle, hover, keyboard focus, success, failure…), each with a caption, on the screens of « Essayez » alone: a screen of « Autres écrans » has its still mockup alone.
7. **Hors périmètre**: what the features leave as they are, naming the neighbouring screens where a reader could expect a change, as they show the same data or the same component: those alone, not the whole app.
8. **Versions**: one line per version, newest first. The first reads « Première version, écrite à partir de l'interview. »; a change request adds « Depuis vN : <what changed> », vN being the version it was made from, and a change of the group names the User Stories, such as « Depuis v1 : US-33 retirée. ». Specster numbers versions itself and never reuses a deleted one's number, so a line names the version it starts from, never its own.

With no screen touched, « Essayez » and « Autres écrans » are left out.

A mockup reproduces its whole screen in the app's own look (its colours, fonts and components, read from the codebase), as it will be once built, and that alone: no before, and no mark on what changes, which its caption says.

## Specster's preview

The Release's page shows the meta-spec in an iframe sandboxed with scripts only: the preview has no cookies, no `localStorage` or `sessionStorage` (they throw), no clipboard, no pop-ups and no navigation of the page around it. A mockup that needs one of these simulates it, such as showing the success state on click instead of really copying. The draft opened from a file can do more than the preview: check it against these limits, not against what works locally.

The PDF download prints the page as it loads, so the mockups follow one another down the page, all open, with no tabs or collapsed panels, and each one's first state reads well on paper.
