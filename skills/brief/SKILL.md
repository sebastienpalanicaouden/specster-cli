---
name: brief
description: "Load a Release's Brief from Specster into the conversation before a grilling: its need alone, its User Stories, their Notes and the Tasks and Sheets linked to them, with neither its Interview nor a Spec Version."
disable-model-invocation: true
---

Load into this conversation the **Brief** of the Release named in the arguments, `R-n` or its address: what it says of its need, so that a grilling here starts from that alone.

These rules hold from now until that grilling is over, after your report as well as before it:

- **Load neither the Interview nor a Spec Version of this Release**, by `specster load` on the Release or on one of its User Stories or any other way, even to look up a fact. A fact the Brief doesn't hold is a question for the User. Once the grilling is over, `/specster:interview R-n` loads the whole Release, at no risk: its transcript stays word for word.
- **The title is only a name**, as « Concorde » or « Marie Curie » would be: deduce nothing from it.
- **The sentences are the need.**
- **The Notes are context**: what one proposes becomes a question to ask, never a settled decision.
- **The Tasks are context**, as the Notes are: what one proposes becomes a question to ask, never a settled decision.
- **The Sheets are context**, as the Notes and the Tasks are: what one proposes becomes a question to ask, never a settled decision.

Run the CLI as [`../cli.md`](../cli.md) says.

1. **Load**: `specster brief <arguments>`. Its Markdown output is the only basis of the grilling, kept in the conversation: write none of it to disk. When it refuses instead, as it does for `US-n` or a version, relay its message as `cli.md` says and stop there, with no other command and no report.

   A Brief can be long, as « ## Fiches reliées » gives each Sheet's whole HTML. When the harness saves the output to a file and shows only its start, such as « Output too large … Full output saved to: … », read that file whole, in chunks if need be, before step 2. A Sheet's HTML too large to read whole: read its start, measure its size in the file, and go on after its code block to the rest of the Brief; step 3 warns about it.

   Done when you have read the Brief to its end, « ## Notes de la Release » and what follows it included, and each Sheet's HTML to its closing fence but those step 3 warns about.
2. **Check the conversation** for the text of an Interview Entry or a Spec Version of this Release, the `R-n` in the Brief's title. An earlier `specster load` on the Release or on one of its User Stories brings them, and `/specster:load`, `/specster:interview` and `/specster:meta-spec` all run one. Done when you know whether it holds any.
3. **Report** to the User, in French, in this order:
   - When step 2 found any, a warning first, such as « Attention : cette conversation contient déjà l'Interview ou une version de R-3, je connais donc ses décisions. Pour partir du seul besoin, ouvrez une nouvelle conversation. » The report goes on all the same.
   - The title, the sentence of each User Story, or « Cette Release n'a pas encore de User Story. », and, in one sentence, the number of Notes loaded, those of the User Stories and of the Release together, of Tasks, those under « Tâches reliées », and of Sheets, those under « Fiches reliées ». Take them in that order: counts that follow each other share one « chargée(s) », joined by commas and « et », and the empty ones that follow each other one « aucune », joined by commas and « ni »: « 1 note, 1 tâche et 2 fiches chargées. », « 5 notes et 2 tâches chargées, aucune fiche. », « Aucune note ni tâche, 1 fiche chargée. », « 2 notes chargées, aucune tâche, 3 fiches chargées. » or « Aucune note, tâche ni fiche. »
   - For each Sheet whose HTML you couldn't read to its closing fence, a warning naming it with its size, such as « Attention : F-3 fait 4,2 Mo, je n'ai pu en lire que le début. »
   - When the Brief's last line says « Non chargée : … » or « Non chargées : … », a warning that a new grilling can contradict what isn't loaded, such as « Attention : cette Release a déjà une Interview (2 ajouts) et une version de spec v3, que je n'ai pas chargées : un nouveau grilling peut les contredire. »
   - When the Brief says « Archivée le … », a warning that an Interview Entry will be refused until the Release is unarchived, such as « Attention : R-3 est archivée : un ajout à son Interview sera refusé tant qu'elle n'est pas désarchivée. »
   - Last, what comes next, such as « Lancez votre grilling ici, puis `/specster:interview R-3` pour l'enregistrer. », or, with no User Story, an invitation to add one before a grilling, such as « Ajoutez-lui une User Story avant de lancer un grilling. »

   The warnings block nothing: ask no confirmation, and leave the grilling for the User to start. Done when the report holds each of these that applies and ends on what comes next, which ends your turn.
