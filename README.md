# specster-cli

[Specster](https://specster.fr) from the command line, for a terminal or an agent such as Claude Code: link a folder to a Project, group its User Stories in Releases, read and add to a Release's Interview and Spec Versions, give it a Tag, write the Notes of a Release or a User Story, give them their Labels and archive them. A single file with no dependencies, for Node.js 20 or later.

## Run it

With no install, npx fetches it from this repo. Each command then takes a few seconds, as npm checks this repo for a newer version every time:

```sh
npx github:sebastienpalanicaouden/specster-cli <command>
```

Installed once, `specster` answers at once; run the same command again to update it:

```sh
npm install --global github:sebastienpalanicaouden/specster-cli
specster <command>
```

## Sign in

The CLI, and the plugin through it, act for you with a Personal Token, read from `SPECSTER_TOKEN`. Set it up once on each computer:

1. **Create the token.** In Specster, « Mon compte », « Jetons personnels », name it after the computer, such as « MacBook », and click « Créer le jeton ». Copy it at once: it starts with `specster_` and is shown only this once.
2. **Store it**, from the Terminal app. Each command below reads the token without showing it, which needs a real terminal: Claude Code's `!` prefix won't do. They are written for zsh, macOS's default shell (`echo $SHELL` prints `/bin/zsh`). Pick one way:

   - **In the macOS Keychain** (recommended), where the token is written nowhere in plain text:

     ```sh
     security add-generic-password -a "$USER" -s specster -w
     print -r -- 'export SPECSTER_TOKEN=$(security find-generic-password -a "$USER" -s specster -w)' >> ~/.zshrc
     ```

     The first command asks for the token twice: paste it each time, nothing shows. The second adds to `~/.zshrc` the line that reads it back from the Keychain whenever a shell starts.

   - **In plain text in `~/.zshrc`**:

     ```sh
     read -rs "token?Jeton Specster : " && print -r -- "export SPECSTER_TOKEN=$token" >> ~/.zshrc && unset token; echo
     ```

     Once `Jeton Specster : ` shows, paste the token and press Enter: nothing shows, and the token stays out of the shell's history.

3. **Check**: `source ~/.zshrc && echo "${SPECSTER_TOKEN:0:9}"` prints `specster_`. If it prints nothing, `grep SPECSTER_TOKEN ~/.zshrc` shows the line you added, which may hold an empty token.
4. **Restart Claude Code**, this once: it reads the environment when it starts, so a session already open lacks the token. Every terminal and session after that has it, with nothing to paste.

Then `specster load R-n` in a linked folder prints the Release.

**Replacing the token**, after deleting it in « Mon compte », or after an Administrator's `user:reset-password`, which deletes them all: create a new one and store it the same way. In the Keychain, add `-U` to the first command (`security add-generic-password -U -a "$USER" -s specster -w`); in plain text, replace the line in `~/.zshrc`. Then restart Claude Code again.

Keep the token out of commits, and out of conversations with an agent, where it would stay in the transcript: whoever has it can read and change your Projects until you delete it.

## Commands

```sh
specster init <project URL>                # links this folder to the Project, in .specster.json
specster release list                      # prints the Project's Releases, the most recent first
specster release create "<title>" [US-n…]  # creates a Release in the Project, and adds the User Stories to it
specster release add R-n US-n…             # adds User Stories to the Release
specster release remove R-n US-n…          # takes User Stories out of the Release, without deleting them
specster release tag R-n <text>            # sets the Release's Tag; an empty text takes it off
specster release archive R-n               # archives the Release with its User Stories
specster release unarchive R-n             # unarchives them
specster interview add R-n                 # adds the standard input, word for word, to the Release's Interview
specster spec-version add R-n              # adds the standard input, HTML, as the Release's next Spec Version
specster note add US-n|R-n                 # adds the standard input, word for word, as the next Note
specster note edit US-n|R-n <N>            # replaces the text of Note N with the standard input
specster note list US-n|R-n                # prints the Notes, oldest first
specster label list                        # prints the Labels of the User Stories, then those of the Releases, with their colors
specster label add US-n|R-n <name>…        # gives Labels of its list to the User Story or the Release
specster label remove US-n|R-n <name>…     # takes Labels off the User Story or the Release
specster archive US-n                      # archives the User Story, if it is in no Release
specster unarchive US-n                    # unarchives it, if it is in no Release
specster load R-n [vN]                     # prints the Release, its User Stories, its Interview and a Spec Version, the Current one by default
specster load US-n [vN]                    # prints the User Story's Release the same way, or, in none, its sentence and Notes
specster brief R-n                         # prints the Release's Brief: its User Stories with their Notes, its own Notes, and what isn't loaded
```

`init` takes the Project's address as your browser shows it, such as `https://specster.fr/projets/<id>`, and writes `.specster.json` in the current folder. The other commands then find it in that folder or the nearest one above, as git does, so `R-3` or `US-2` is enough. A command acting on one Release or User Story also takes its address instead, such as `https://specster.fr/projets/<id>/releases/3` or `https://specster.fr/projets/<id>/us/2`, which needs no linked folder. The User Stories that `release create`, `release add` and `release remove` name go by `US-n` alone, and `release create` needs the link.

`interview add`, `spec-version add`, `note add` and `note edit` read the standard input, for instance from a heredoc, so nothing needs to be saved to a file:

```sh
specster interview add R-2 <<'EOF'
Question : quel bouton ?
Réponse : « Copier », après la phrase.
EOF
```

`release list` prints a line per Release, in progress or archived, skipping what it lacks, such as « R-3 · Écrire et publier · archivée · tag v1.2.0 · US-2, US-3, US-5 · merged », with « aucune User Story » for an empty one. `release create` sends two requests: when the User Stories are refused, the Release stays, already announced, and the command exits with 1. `release add` and `release remove` change all the User Stories named or none, and print a line for each, then the warning when the group now differs from what the Current Spec Version covers: « Le groupe a changé depuis v1 : US-8 ajoutée, US-5 retirée. Ajoutez une version de spec pour qu'elle couvre le groupe actuel. ». A User Story is in one Release at most, and leaves it before entering another. `release tag` takes its text as one argument, between quotes when it has spaces, and `""` takes the Tag off. `release add`, `release remove`, `release tag`, `release archive` and `release unarchive` may run again without risk: nothing changes the second time.

`load R-n` prints Markdown: the Release's title, when it was archived if it is, « Tag : v1.2.0 » or « Tag : aucun », « Labels : À relire, bug » if it has any, its User Stories, each with its sentence and Notes, each Interview Entry with its date, then the Spec Version's HTML under a heading saying what it covers, and last that same warning. `load US-n` first says « US-2 est dans R-3. », and is what keeps older citations such as `US-2 v1` readable; a User Story in no Release has only its sentence, « Aucune Release. » and its Notes, and asking it for a version is refused.

`load` leaves out a Release's own Notes, which `note list` prints, each under « ### Note 2 · ajoutée le … (modifiée le …) ». A Note is named by its number, as its page shows it, numbered apart on a Release and on each of its User Stories; deleting one is done on that page.

`brief R-n` prints a Release's Brief, what it says of its need, to read alone before a grilling. It is Markdown: the Release's title, when it was archived if it is, « ## User Stories » with each one's sentence and Notes, as `load` prints them, or « Cette Release n'a pas encore de User Story. », then « ## Notes de la Release » with its own Notes, oldest first, each as « Note 1 : … », or « Cette Release n'a pas encore de note. ». A last line says what it leaves out, by a count and a number and nothing of their content: « Non chargées : Interview (2 ajouts), version de spec v3. », or, when only one exists, « Non chargée : Interview (1 ajout). » or « Non chargée : version de spec v3. », naming the Current Spec Version alone. With neither, there is no such line. `brief` never prints the Interview's text, which it reads only to count its Entries, a Spec Version, the Tag, the Labels or the warning about the group.

The Brief loads all the Notes, whole and unfiltered, as the CLI can't sort free text: a Note, such as a delivery Note citing a meta-spec or one proposing a lead, can hold a decision. `brief` takes one Release, by `R-n` or its address: `US-n`, a version after the Release, or anything else gets « Désignez la Release par R-n ou par son adresse. » and the usage. For a User Story in no Release, `load US-n` already gives its sentence and Notes and nothing more.

`label list` prints a Project's two lists apart, under « Labels des User Stories : » and « Labels des Releases : », each line such as « merged · vert », in alphabetical order. The same name in both is two Labels. `label add` and `label remove` choose the list from `US-n` or `R-n`, take one name or more, a name with spaces between quotes, such as `specster label add R-5 bug "À relire"`, recognized whatever their case, and print a line for each Label. They may run again without risk: they then say the User Story or the Release already was as asked. A name that list doesn't have refuses them all and changes nothing, and the message lists its Labels. The CLI creates, renames, recolors and deletes no Label: that is done in Specster, on the Project's « Labels » page or the « Labels des Releases » page.

`archive` and `unarchive` may run again without risk, as above. A User Story in a Release is archived and unarchived with it: both print Specster's refusal, which gives the command to use.

`interview add` and `spec-version add` take a Release: given a User Story, they print Specster's refusal, which names its Release or says how to create one. A Release with no User Story refuses both. An Archived Release is read-only but for its Tag, its Notes and its Labels, and an Archived User Story but for its Notes and its Labels: what they no longer accept prints Specster's refusal.

Errors, such as a missing token, a folder linked to no Project or Specster's own refusals, are printed on the standard error, in French, and the command exits with 1.

## Claude Code plugin

This repo is also a Claude Code plugin, `specster`, which runs the CLI for you. Install it in Claude Code:

```
/plugin install specster --marketplace sebastienpalanicaouden/specster-cli
```

It adds four commands, each run by hand:

- `/specster:brief R-n`, before a grilling: loads the Release's Brief into the conversation and reports its title, the sentence of each User Story and how many Notes it loaded. It warns when a new grilling can contradict what isn't loaded, when the Release is archived, as an Interview Entry is then refused until it is unarchived, and when the conversation already holds that Interview or a Spec Version, advising a new one. It blocks nothing, asks no confirmation, and ends on what comes next, leaving the grilling for you to start. Until the grilling is over, the agent loads neither the Interview nor a Spec Version of that Release, even to look up a fact; it takes the title for a mere name, the sentences for the need, and what a Note proposes for a question to ask, never a settled decision.
- `/specster:interview R-n`, at the end of a grilling: saves its questions and answers, word for word, as the next Entry of the Release's Interview.
- `/specster:meta-spec R-n ["change request"]`: writes the Release's meta-spec, a functional spec holding a mockup, from its Interview; or, given a sentence, its next version, changed only where the request reaches. You try the draft in your browser, and it is added to Specster as a Spec Version once you approve it. After a change of the group, it writes the next version: it adds to the Interview the questions and answers of a User Story added, notes the change in the « Versions » section, such as « Depuis v1 : US-33 retirée. », and has the open tickets cite the new version, a closed one keeping its citation.
- `/specster:load R-n [vN]`: loads the Release, its User Stories, its Interview and a Spec Version, the Current one by default, into the conversation, before `/to-spec` or `/implement` for instance. It also takes `US-n`, and loads the Release it is in.

`/specster:interview` and `/specster:meta-spec` confirm the Release by reading the sentences of all its User Stories. Given `US-n`, they propose its Release, or to create one.

They need the same `SPECSTER_TOKEN`, and a folder linked with `specster init` for `R-n` and `US-n`.

To grill a Release from its need alone, take three steps, in a new conversation:

1. `/specster:brief R-n`.
2. The grilling, which you start yourself.
3. `/specster:interview R-n`, which saves it as the next Entry of the Interview.

A grilling works with what its conversation holds, so the Brief and the grilling follow each other in one conversation. That conversation is a new one because an Interview or a Spec Version already in it would guide the agent with decisions already made: `/specster:brief` says so, and gives the Brief all the same. `/specster:interview` then loads the whole Release, at no risk, as the grilling is over and its transcript stays word for word. `/specster:meta-spec R-n` can follow there or elsewhere, as it reloads the whole Release.

## Link a repo

In each repo whose features you keep in Specster:

1. Run `specster init <project URL>` at its root, and commit `.specster.json`. It holds no secret, and every computer then knows the Project.
2. Add these lines to its `CLAUDE.md`, so that specs and tickets name the meta-spec they come from, `/implement` loads it, the agent archives a Release once a merge finishes it, with a Note on what delivered it and the « merged » Label on it and on each of its User Stories, and gives it its Tag after a successful deployment (the plugin's commands are run by hand, so the agent runs the CLI itself):

   ````md
   ### Meta-specs

   A meta-spec is the Spec Version, in Specster, that specifies a Release: a functional spec holding a mockup. This repo is linked to its Specster Project by `.specster.json`, so `R-n` names a Release there and `US-n` a User Story.

   - A spec or ticket written from a meta-spec opens with « Meta-spec : R-n vN. Elle fait foi pour l'apparence et le comportement, sauf les exceptions écrites ici ; ses commandes de démonstration ne font pas partie de la feature. », naming the exact version, and lists those exceptions. Each ticket repeats the line, for `/implement` reads the ticket alone.
   - Before implementing a ticket that cites a meta-spec, load that version: `specster load R-n vN`, or `npx --yes github:sebastienpalanicaouden/specster-cli load R-n vN` where `specster` isn't installed. It needs the User's Personal Token in `SPECSTER_TOKEN`; without it, ask the User to set it rather than working from the ticket alone. Older specs and tickets name a User Story instead, which `specster load US-n vN` still reads, through its Release.
   - After merging a PR, archive each Release it delivers, without waiting for the deploy tag. The tickets the PR closed name their Releases (« Meta-spec : R-n vN »). A Release is delivered once its spec and every ticket citing « Meta-spec : R-n » are closed (check each citation is R-n itself, not R-n0); while one of them is open, it stays in progress. For each one delivered, add its delivery Note, give « merged » to it and to each of its User Stories, archive it, and tell the User in one line: `specster note add R-n` with the Note on its standard input, then `specster label add R-n merged`, then `specster label add US-n merged` for each of its User Stories, then `specster release archive R-n`, through `npx` and with `SPECSTER_TOKEN` as above. If a Label can't be given, for instance because its list has no « merged » Label, archive it all the same and say so in that line. Give no other Label unless the User asks. The Note, in French, on this model:

     ```
     Livrée par la PR #52 (https://github.com/…/pull/52), squash-mergée en 9b1c2e4, d'après la meta-spec R-3 v2.
     User Stories : US-2, US-3, US-5.
     Spec : #49. Tickets : #50, #51.
     Écarts avec la meta-spec : aucun.
     Reste à faire : rien.
     ```

     Dates may be added where they help; the Tag stays out, as it comes after the deployment. A Note to correct is read with `specster note list R-n` and replaced with `specster note edit R-n <N>`, its number.
   - After a successful deployment, run `specster release tag R-n vX.Y.Z` for each Archived Release with no Tag that has « merged », whatever its case: `specster release list` shows them. A canceled Release has no « merged », so it stays without a Tag.
   ````
