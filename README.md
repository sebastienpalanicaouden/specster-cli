# specster-cli

[Specster](https://specster.fr) from the command line, for a terminal or an agent such as Claude Code: link a folder to a Project, list its User Stories, create them and change their sentences, group them in Releases, read and add to a Release's Interview and Spec Versions, give it a Tag, write the Notes of a Release or a User Story, give them their Labels and archive them, and note the Project's Tasks, mark them done and link them to its User Stories, and list, read, create and change its Sheets, give them their Labels and link them to its Tasks and to its User Stories, those of a Release's User Stories named when it is loaded and given with their HTML in its Brief. A single file with no dependencies, for Node.js 20 or later.

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
specster init <project URL>                # links this folder to the Project, in .specster.json, and writes « Meta-specs » and « Fiches » in CLAUDE.md
specster us list                           # prints all the Project's User Stories, archived ones included, by number
specster us create                         # creates a User Story in the Project, with the standard input as its sentence
specster us edit US-n                      # replaces the User Story's sentence with the standard input
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
specster label list                        # prints the Labels of the User Stories, those of the Releases, then those of the Sheets, with their colors
specster label add US-n|R-n|F-n <name>…    # gives Labels of its list to the User Story, the Release or the Sheet
specster label remove US-n|R-n|F-n <name>… # takes Labels off the User Story, the Release or the Sheet
specster archive US-n                      # archives the User Story, if it is in no Release
specster unarchive US-n                    # unarchives it, if it is in no Release
specster task list [--done]                # prints the Project's Tasks to do, or those done, in the order of their tab
specster task add                          # adds a Task to the Project, with the standard input as its text; prints its T-n
specster task edit T-n                     # replaces the Task's text with the standard input
specster task delete T-n                   # deletes the Task, with its links to User Stories
specster task done T-n                     # marks the Task done
specster task undone T-n                   # puts it back to do
specster task link T-n US-n…               # links the Task to the User Stories
specster task unlink T-n US-n…             # unlinks it from them
specster sheet list                        # prints the Project's Sheets, those in progress then the archived ones
specster sheet load F-n                    # prints the Sheet's HTML, alone
specster sheet create --title "<title>"    # creates a Sheet in the Project, with the standard input, HTML, as its content
specster sheet edit F-n [--title "<title>"]  # changes the Sheet's title, replaces its HTML with the standard input, or both
specster sheet link F-n T-n|US-n…          # links the Sheet to the Tasks and the User Stories
specster sheet unlink F-n T-n|US-n…        # unlinks it from them
specster load R-n [vN]                     # prints the Release, its User Stories, their Tasks, their Sheets without their HTML, its Interview and a Spec Version, the Current one by default
specster load US-n [vN]                    # prints the User Story's Release the same way, or, in none, its sentence, Notes and Tasks
specster brief R-n                         # prints the Release's Brief: its User Stories with their Notes and Tasks, their Sheets with their HTML, its own Notes, and what isn't loaded
```

`init` takes the Project's address as your browser shows it, such as `https://specster.fr/projets/<id>`, and writes `.specster.json` in the current folder. It also writes the « Meta-specs » and « Fiches » sections of that folder's `CLAUDE.md`, the agent's rules on meta-specs and on Sheets, each unless it is already there, as « Link a repo » says. The other commands then find it in that folder or the nearest one above, as git does, so `R-3` or `US-2` is enough. A command acting on one Release or User Story also takes its address instead, such as `https://specster.fr/projets/<id>/releases/3` or `https://specster.fr/projets/<id>/us/2`, which needs no linked folder, and `label add` and `label remove` take a Sheet's too, such as `https://specster.fr/projets/<id>/fiches/4`. The User Stories that `release create`, `release add` and `release remove` name go by `US-n` alone, and `release create`, `us create` and `us list` need the link.

`us create`, `us edit`, `interview add`, `spec-version add`, `note add`, `note edit`, `task add`, `task edit`, `sheet create` and `sheet edit` read the standard input, for instance from a heredoc, so nothing needs to be saved to a file, and an apostrophe needs no quoting:

```sh
specster us create <<'EOF'
En tant que rédactrice, je veux publier un article, afin d'être lue.
EOF
specster interview add R-2 <<'EOF'
Question : quel bouton ?
Réponse : « Copier », après la phrase.
EOF
```

`us create` prints the new User Story's number and its sentence as Specster saved it, such as « US-37 créée : « En tant que rédactrice, je veux publier un article, afin d'être lue. ». », and `us edit` prints « US-37 modifiée. ». As on Specster's pages, the spaces and blank lines around the sentence are taken off and the rest is kept as written, line breaks included; an empty sentence, or one over 500 characters, prints Specster's refusal, such as « La User Story fait 612 caractères, pour 500 au maximum. ». Neither the CLI nor Specster checks the form « En tant que …, je veux …, afin de … »: like the web form, they take any sentence that isn't empty, of 500 characters at most. `us create` puts the User Story in no Release: `release add R-n US-n` does that next. Neither command takes the sentence as an argument, and the CLI deletes no User Story. `us edit` may run again without risk; an Archived User Story refuses it, with Specster's message saying what to unarchive, the User Story itself or its Release.

`us list`, in a linked folder, prints all the Project's User Stories, in progress and archived, in the order of their numbers, with no filter, so that an agent about to write a new one can take up the words of the others and see whether one already says the same, a need already delivered included. Each is « US-12 · » or, once archived, « US-3 · archivée · », then its sentence as written, line breaks included, and a blank line parts two of them; neither its Release, nor its Labels, nor its dates are printed:

```
US-3 · archivée · En tant qu'utilisateur, je veux catégoriser mes User Stories avec des Labels, afin de les différencier dans les listes.

US-12 · En tant qu'utilisateur, je veux mettre une User Story en favorite, afin de la retrouver en tête de liste.

US-14 · En tant qu'utilisateur, je veux que l'agent crée une User Story,
afin de ne pas la recopier à la main.
```

Without any, it prints « Ce projet n'a pas encore de User Story. ». It takes no argument: given one, whatever it is, it prints the usage. Against a Specster older than the CLI, which serves only the creation of a User Story there, it prints « Specster, à https://specster.fr, ne connaît pas encore cette commande : il est plus ancien que la CLI. », as any command newer than Specster does.

`release list` prints a line per Release, in progress or archived, skipping what it lacks, such as « R-3 · Écrire et publier · archivée · tag v1.2.0 · US-2, US-3, US-5 · merged », with « aucune User Story » for an empty one. `release create` sends two requests: when the User Stories are refused, the Release stays, already announced, and the command exits with 1. `release add` and `release remove` change all the User Stories named or none, and print a line for each, then the warning when the group now differs from what the Current Spec Version covers: « Le groupe a changé depuis v1 : US-8 ajoutée, US-5 retirée. Ajoutez une version de spec pour qu'elle couvre le groupe actuel. ». A User Story is in one Release at most, and leaves it before entering another. `release tag` takes its text as one argument, between quotes when it has spaces, and `""` takes the Tag off. `release add`, `release remove`, `release tag`, `release archive` and `release unarchive` may run again without risk: nothing changes the second time.

`load R-n` prints Markdown: the Release's title, when it was archived if it is, « Tag : v1.2.0 » or « Tag : aucun », « Labels : À relire, bug » if it has any, its User Stories, each with its sentence and Notes, « ## Tâches reliées », « ## Fiches reliées », each Interview Entry with its date, then the Spec Version's HTML under a heading saying what it covers, and last that same warning. `load US-n` first says « US-2 est dans R-3. », and is what keeps older citations such as `US-2 v1` readable; a User Story in no Release has only its sentence, « Aucune Release. », its Notes and « ## Tâches reliées » with its own Tasks, and no Sheet, and asking it for a version is refused.

« ## Tâches reliées » holds the Tasks linked to the User Stories, each once, even when several of them link it, those to do first, the most recently added first, then those done, the most recently done first. Each is a block as `task list` prints it, a level lower: « ### T-7 · À faire » or « ### T-3 · Faite le 7 novembre 2026 », its gray line ending, in a Release, with the User Stories of that Release that link it, « User Stories : US-28, US-38 », then its whole text. Without any, it says « Aucune tâche reliée. ». Against a Specster older than the Tasks, `load` and `brief` leave the section out.

« ## Fiches reliées », right after « ## Tâches reliées », holds the Sheets linked to the Release's User Stories, archived or not, each once, even when several of them link it, by number, and none linked to its Tasks alone. Each is « ### F-3 · Landing page », then a line such as « Ajoutée le 2 novembre 2026 · modifiée le 10 novembre 2026 · archivée le 11 novembre 2026 · User Stories : US-4, US-5 », « modifiée » once its title or its HTML has been changed and « archivée » while it is archived, the days Paris's, without the time, and the User Stories those of the Release that link it, by number, never one of another Release or of none; nothing says whether it is a Favorite. `load` names them so, a blank line between two, without their HTML, which `sheet load F-n` prints and `brief` gives. Without any, it says « Aucune fiche reliée. », for a Release without a User Story too. Against a Specster older than the Sheets, `load` and `brief` leave the section out.

`load` leaves out a Release's own Notes, which `note list` prints, each under « ### Note 2 · ajoutée le … (modifiée le …) ». A Note is named by its number, as its page shows it, numbered apart on a Release and on each of its User Stories; deleting one is done on that page.

`brief R-n` prints a Release's Brief, what it says of its need, to read alone before a grilling. It is Markdown: the Release's title, when it was archived if it is, « ## User Stories » with each one's sentence and Notes, as `load` prints them, or « Cette Release n'a pas encore de User Story. », « ## Tâches reliées » and « ## Fiches reliées », as `load` prints them, each Sheet's line followed here by a blank line and its whole HTML, then « ## Notes de la Release » with its own Notes, oldest first, each as « Note 1 : … », or « Cette Release n'a pas encore de note. ». A last line says what it leaves out, by a count and a number and nothing of their content: « Non chargées : Interview (2 ajouts), version de spec v3. », or, when only one exists, « Non chargée : Interview (1 ajout). » or « Non chargée : version de spec v3. », naming the Current Spec Version alone. With neither, there is no such line. `brief` never prints the Interview's text, which it reads only to count its Entries, a Spec Version, the Tag, the Labels or the warning about the group.

A Sheet's HTML comes as Specster keeps it, byte for byte as `sheet load` prints it, in a code block opened with ```` ```html ````. Its fences are one backtick longer than the longest run of backticks in the HTML, three at least, so that neither a heading nor a code block written in the HTML passes for a part of the Brief, and a line break is added before the closing one only when the HTML ends without one. Nothing is cut, whatever its size, up to a Sheet's 5 Mo, images in base64 included. `brief` reads each Sheet's HTML once the Release has named it; when one of them can't be read, such as a Sheet deleted in between, it prints nothing but Specster's refusal, « Fiche introuvable. ».

The Brief loads all the Notes, the linked Tasks and the linked Sheets, whole and unfiltered, as the CLI can't sort free text: a Note, such as a delivery Note citing a meta-spec or one proposing a lead, can hold a decision, and so can a Task or a Sheet. `brief` takes one Release, by `R-n` or its address: `US-n`, a version after the Release, or anything else gets « Désignez la Release par R-n ou par son adresse. » and the usage. For a User Story in no Release, `load US-n` already gives its sentence, Notes and Tasks and nothing more.

`label list` prints a Project's three lists apart, under « Labels des User Stories : », « Labels des Releases : » and « Labels des fiches : », each line such as « merged · vert », in alphabetical order, or « Aucun Label. ». The same name in two of them is two Labels. Against a Specster older than the Sheets' Labels, which answers 404 to their list, it prints the first two alone. `label add` and `label remove` choose the list from `US-n`, `R-n` or `F-n`, or from the address given, take one name or more, a name with spaces between quotes, such as `specster label add R-5 bug "À relire"`, recognized whatever their case, and print a line for each Label, such as « Label « Lu » ajouté à F-3. » or « Label « Lu » retiré de F-3. ». They may run again without risk: they then say the User Story, the Release or the Sheet already was as asked, « F-3 avait déjà le Label « Lu ». » or « F-3 n'avait pas le Label « Lu ». ». A name that list doesn't have refuses them all and changes nothing, and the message lists its Labels, such as « Les fiches n'ont pas de Label « Relu ». Leurs Labels : À revoir, Lu, Obsolète. Aucun Label n'a été changé. ». Anything else than one of them gets « Désignez la User Story, la Release ou la fiche par US-n, R-n, F-n ou son adresse. ». The CLI creates, renames, recolors and deletes no Label: that is done in Specster, on the Project's « Labels » page, the « Labels des Releases » page or the « Labels des fiches » page.

`archive` and `unarchive` may run again without risk, as above. A User Story in a Release is archived and unarchived with it: both print Specster's refusal, which gives the command to use.

A Task, something to do in the Project, goes by `T-n`, in a linked folder only: it has no address of its own. `task list` prints the Tasks to do, the most recently added first, or, with `--done`, those done, the most recently done first, as the « Tâches » page's tabs list them. Each is a block of Markdown: « ## T-3 · À faire », or « ## T-3 · Faite le 7 novembre 2026 », then « Ajoutée le 2 novembre 2026 · modifiée le 4 novembre 2026 · User Stories : US-26 · Archivée, US-30 », « · modifiée le … » only once its text has been changed, and each User Story written as its pill on the page, « US-36 · R-15 », « US-26 · Archivée » or « US-35 », or « User Stories : aucune », the line ending with the Sheets linked to the Task when it has some, « · Fiches : F-3, F-5 · Archivée », an Archived Sheet said so, and with nothing more against a Specster older than the Sheets, then its whole text, without the line breaks that end it. The days are Paris's, without the time. Without any, it prints the page's message: « Ce projet n'a pas encore de tâche. », « Aucune tâche à faire. » or « Aucune tâche faite. ».

`task add` prints the new Task's number alone, such as « T-8 », and `task edit` « T-8 modifiée. »: the text is kept as written, blank lines and spaces included, under a Note's rules, and an empty one prints Specster's refusal, « Écrivez la tâche. ». Neither takes the text as an argument. `task delete` prints « T-8 supprimée. ». `task done` and `task undone` print « T-8 marquée comme faite. » and « T-8 remise à faire. », `task link T-8 US-5…` and `task unlink T-8 US-5…` a line per User Story, such as « T-8 reliée à US-5. » or « T-8 déliée de US-5. », archived ones included, all of them or none. The four of them may run again without risk: they then say the Task already was as asked, such as « T-8 était déjà faite. » or « T-8 n'était pas reliée à US-5. ».

A Sheet, a document kept in the Project outside any Release, a title and an HTML, goes by `F-n`, in a linked folder; only `label add` and `label remove` take its address too. `sheet list` prints the Sheets in progress in the order of the « Fiches » page, the Favorites first, then the Archived Sheets, the most recently archived first, two lines each and a blank line between them: « F-3 · Audit de sécurité », then « Créée le 2 novembre 2026 à 18:05 · modifiée le 10 novembre 2026 à 11:20 · Favorite · Archivée le 11 novembre 2026 à 09:12 · Tâches : T-3, T-6 · User Stories : US-15 · Labels : À revoir, Lu », each part after the creation only when it applies, the Labels in alphabetical order. The dates are Paris's. Against a Specster older than the Sheet Labels, it prints the Sheets without « Labels : ». Without any Sheet, it prints « Ce projet n'a pas encore de fiche. ». `sheet load F-n` prints the Sheet's HTML alone, byte for byte, with nothing around it, so that `specster sheet load F-3 > audit.html` saves it as it is.

`sheet create --title "<title>"` takes the HTML on the standard input, such as `specster sheet create --title "Audit de sécurité" < audit.html`, and prints « F-4 créée. »; without `--title`, it is refused before anything is sent. `sheet edit F-n` replaces the Sheet's HTML with the standard input, when it is neither a terminal nor empty, `sheet edit F-n --title "<title>"` changes its title, and both together change both or neither; each prints « F-3 modifiée. », and with neither a title nor an HTML it is refused before anything is sent. The HTML a Sheet had is lost once replaced: the CLI asks no question and has no option to confirm, so an agent asks you in the conversation first. Specster's refusals print as they are: a title that is empty, over 200 characters or on several lines, an HTML that is empty, not UTF-8 or over 5 Mo, the limit of 30 HTMLs an hour, shared with Specster's pages, « F-4 est archivée : désarchivez-la pour la modifier. » and « Fiche introuvable. ». The CLI neither marks a Sheet as a Favorite, nor archives, unarchives or deletes one: that is done on its page.

`sheet link F-n` links the Sheet, archived or not, to the Tasks and the User Stories named after it by `T-n` or `US-n`, in any order and whatever their state, and `sheet unlink F-n` unlinks it from them, in one request: all or nothing, so « Tâche introuvable. » or « User Story introuvable. » changes nothing for the others. Each prints a line for each, in the order given: « F-3 reliée à T-5. » or « F-3 était déjà reliée à T-5. », « F-3 déliée de US-2. » or « F-3 n'était pas reliée à US-2. », so asking again is no error. `task list` then names the Sheets of each Task; `load` and `brief` name those of a Release's User Stories under « Fiches reliées », and never a Task's, even under « Tâches reliées ».

`interview add` and `spec-version add` take a Release: given a User Story, they print Specster's refusal, which names its Release or says how to create one. A Release with no User Story refuses both. An Archived Release is read-only but for its Tag, its Notes and its Labels, an Archived User Story but for its Notes and its Labels, and an Archived Sheet but for its links and its Labels: what they no longer accept prints Specster's refusal.

Errors, such as a missing token, a folder linked to no Project or Specster's own refusals, are printed on the standard error, in French, and the command exits with 1.

## Claude Code plugin

This repo is also a Claude Code plugin, `specster`, which runs the CLI for you. Install it in Claude Code:

```
/plugin install specster --marketplace sebastienpalanicaouden/specster-cli
```

It adds four commands, each run by hand:

- `/specster:brief R-n`, before a grilling: loads the Release's Brief into the conversation, the Tasks and the Sheets linked to its User Stories included, reading it whole even when Claude Code saves so long an output to a file and shows only its start, and reports its title, the sentence of each User Story and how many Notes, Tasks and Sheets it loaded, in one sentence, such as « 1 note, 1 tâche et 2 fiches chargées. » or « Aucune note, tâche ni fiche. ». It warns, naming it with its size, about each Sheet too large for it to read whole, such as « Attention : F-3 fait 4,2 Mo, je n'ai pu en lire que le début. », when a new grilling can contradict what isn't loaded, when the Release is archived, as an Interview Entry is then refused until it is unarchived, and when the conversation already holds that Interview or a Spec Version, advising a new one. It blocks nothing, asks no confirmation, and ends on what comes next, leaving the grilling for you to start. Until the grilling is over, the agent loads neither the Interview nor a Spec Version of that Release, even to look up a fact; it takes the title for a mere name, the sentences for the need, and what a Note, a Task or a Sheet proposes for a question to ask, never a settled decision: it treats the Tasks and the Sheets as it does the Notes.
- `/specster:interview R-n`, at the end of a grilling: saves its questions and answers, word for word, as the next Entry of the Release's Interview.
- `/specster:meta-spec R-n ["change request"]`: writes the Release's meta-spec, a functional spec holding a mockup of each screen it changes, from its Interview; or, given a sentence, its next version, changed only where the request reaches. Of the Sheets linked to the Release's User Stories, which its load names, it reads with `sheet load` the HTML of those the Interview's decisions name, such as a mockup the page follows, and only those, takes from each only what the Interview decided of it, and tells you, naming it, when one is too large to read whole. Right after the meta-spec's header, « Écrans touchés » lists each screen whose look changes, a page, a dialog, an e-mail or a PDF, found by searching the code for every place that uses what changes, so that a screen changed as a side effect, through a shared component for instance, is listed too. Then come « Essayez », with an interactive mockup of each screen a feature is used on; « Autres écrans », with each screen changed as a side effect, still, as it will be; then « Comportement », « Les états », « Hors périmètre », which names the neighbouring screens left as they are, and « Versions ». Each mockup reproduces its whole screen to place it, with no before and no mark on what changes, but only what its line in « Écrans touchés » describes changes: the real app is authoritative for the rest. A Release that changes no screen gets « Aucun écran ne change. », with neither « Essayez » nor « Autres écrans ». You try the draft in your browser, checking « Écrans touchés » on it, and it is added to Specster as a Spec Version once you approve it. Every next version takes this format, even from a Current Spec Version in an older one, while the versions already sent stay as they are. After a change of the group, it writes the next version: it adds to the Interview the questions and answers of a User Story added, notes the change in the « Versions » section, such as « Depuis v1 : US-33 retirée. », and has the open tickets cite the new version, a closed one keeping its citation. When two Entries of the Interview contradict each other, it shows you both decisions with their dates and asks which holds, then saves the question and your answer as a new Entry, so the question doesn't come back at the next version, and the content follows your answer; a change request draws on no Entry, so it asks nothing of the kind. A later Entry that already chose between them holds, and it asks nothing; otherwise the most recent doesn't win by itself, as a grilling from a Brief can contradict by ignorance, not by choice.
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
2. Commit the `CLAUDE.md` of that folder too: `init` writes two sections in it, « ### Meta-specs » then « ### Fiches », and prints a line for each one it writes, « La section « Meta-specs » est ajoutée à CLAUDE.md. » and « La section « Fiches » est ajoutée à CLAUDE.md. ». Each is written only when `CLAUDE.md` has no such heading: « Meta-specs » at the end of the file, and « Fiches » right after the « Meta-specs » section, in a `CLAUDE.md` that `init` creates if missing; the rest of the file stays as it is. A section already there is left alone, whatever it says, so `init` can be run again, and it is how a repo linked before v0.8.0 gets what it lacks. For the same reason, a repo linked before keeps the text its sections had then: a rule added since, such as running `us list` before each creation of a User Story or giving a Sheet a Label only when asked, is copied by hand from the sections below.

   « Meta-specs » has specs and tickets name the meta-spec they come from, `/implement` load it, the agent create User Stories and change their sentences, written as « En tant que …, je veux …, afin de … », in the words of the existing ones, which it reads with `us list` before each creation, naming one that already seems to say the same and creating only once you agree, note Tasks when you ask or once you agree, and link each Task to the User Stories it draws from it, archive a Release once a merge finishes it, with a Note on what delivered it and the « merged » Label on it and on each of its User Stories, and give it its Tag after a successful deployment (the plugin's commands are run by hand, so the agent runs the CLI itself). « Fiches » says when the agent creates a Sheet or changes one, at your request or once you agree to its « Enregistrer une Fiche : … ? », that it asks you before each replacement of a Sheet's HTML, as the old one is lost, when it reads one, that it links on its own the Tasks and the User Stories it draws from one, that it gives a Sheet a Label or takes one from it only when you ask, and that marking a Sheet as a Favorite, archiving and deleting it stay yours. « Meta-specs » reads:

   ````md
   ### Meta-specs

   A meta-spec is the Spec Version, in Specster, that specifies a Release: a functional spec holding a mockup of each screen it changes. This repo is linked to its Specster Project by `.specster.json`, so `R-n` names a Release there and `US-n` a User Story.

   - A spec or ticket written from a meta-spec opens with « Meta-spec : R-n vN. Elle fait foi pour l'apparence et le comportement de ce qu'elle change, l'app réelle pour le reste de chaque écran, sauf les exceptions écrites ici ; ses commandes de démonstration ne font pas partie de la feature. », naming the exact version, and lists those exceptions. Each ticket repeats the line, for `/implement` reads the ticket alone.
   - Before implementing a ticket that cites a meta-spec, load that version: `specster load R-n vN`, or `npx --yes github:sebastienpalanicaouden/specster-cli load R-n vN` where `specster` isn't installed. It needs the User's Personal Token in `SPECSTER_TOKEN`; without it, ask the User to set it rather than working from the ticket alone. Older specs and tickets name a User Story instead, which `specster load US-n vN` still reads, through its Release.
   - To create a User Story in the linked Project, or change its sentence, run `specster us create`, or `specster us edit US-n`, with the sentence on its standard input, through `npx` and with `SPECSTER_TOKEN` as above. Write the sentence as « En tant que …, je veux …, afin de … », when creating as when editing. When the role, the need or the benefit is missing, ask the User for it rather than inventing it; when all three are there, create or edit without asking for confirmation. Before creating one, run `specster us list` and write the sentence in the words the existing ones use, for the role as for the domain's terms; when one already seems to say the same, name it in one line, such as « US-12 dit déjà : « … ». La créer quand même ? », and create it only once the User says yes.
   - To read the Tasks of the linked Project, run `specster task list`, or `specster task list --done` for those done, through `npx` and with `SPECSTER_TOKEN` as above. When the User asks you to note a Task, add it at once with `specster task add`, its text on its standard input. When, while working, you notice something to do outside your current work, propose it in one line, such as « Ajouter la tâche : … ? », and add it only once the User says yes: unlike a User Story, a Task is never added unasked. When you create a User Story from a Task, link them on your own with `specster task link T-n US-n`. Change a Task's text, delete it, mark it done or back to do (`specster task edit T-n`, `task delete T-n`, `task done T-n`, `task undone T-n`) only when the User asks, never on your own.
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

   « Fiches » reads:

   ````md
   ### Fiches

   A Sheet, « Fiche » on screen, is a title and an HTML document that the linked Specster Project keeps outside any Release, such as an audit or a research; `F-n` names one there. Its commands are `specster sheet …`, or `npx --yes github:sebastienpalanicaouden/specster-cli sheet …` where `specster` isn't installed, with the User's Personal Token in `SPECSTER_TOKEN`; without it, ask the User to set it.

   - Create a Sheet, or change one, when the User asks: `specster sheet create --title "<title>"`, its HTML on the standard input, and `specster sheet edit F-n`, with `--title "<title>"` for a new title, an HTML on the standard input for a new HTML, or both. When, while working, you produce something worth keeping as a Sheet, or see one to change, propose it in one line, such as « Enregistrer une Fiche : … ? », and act only once the User says yes.
   - A Sheet has no versions: `sheet edit` replaces its HTML without a question, and the old one is lost. So before each replacement, even one the User asked for, ask for their agreement in the conversation, recalling that the HTML the Sheet has will be lost. One agreement covers one replacement: ask again for the next. A title changed alone loses nothing, so it takes no such question.
   - Read a Sheet's HTML, with `specster sheet load F-n`, when the User names that Sheet or your work depends on it, and only then; `specster sheet list` prints their titles and their links.
   - When you create a Task or a User Story from a Sheet, link them on your own with `specster sheet link F-n T-n` or `specster sheet link F-n US-n`.
   - Give a Sheet a Label, or take one from it, only when the User asks: `specster label add F-n <label>`, `specster label remove F-n <label>`.
   - Marking a Sheet as a Favorite, archiving it, unarchiving it and deleting it are the User's, on its page: when asked for one, say so.
   ````
