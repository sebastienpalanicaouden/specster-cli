# specster-cli

[Specster](https://specster.fr) from the command line, for a terminal or an agent such as Claude Code: link a folder to a Project, then read and add to a User Story's Interview and Spec Versions. A single file with no dependencies, for Node.js 20 or later.

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

Create a Personal Token in Specster, « Mon compte », « Jetons personnels », one per computer, and give it in `SPECSTER_TOKEN`, for instance in your shell's profile. Never commit it: whoever has it can read and change your Projects until you delete it.

```sh
export SPECSTER_TOKEN=specster_…
```

## Commands

```sh
specster init <project URL>        # links this folder to the Project, in .specster.json
specster interview add US-n        # adds the standard input, word for word, to the User Story's Interview
specster spec-version add US-n     # adds the standard input, HTML, as the User Story's next Spec Version
specster load US-n [vN]            # prints the User Story, its Interview and a Spec Version, the Current one by default
```

`init` takes the Project's address as your browser shows it, such as `https://specster.fr/projets/<id>`, and writes `.specster.json` in the current folder. The other commands then find it in that folder or the nearest one above, as git does, so `US-2` is enough. They also take a User Story's address instead, such as `https://specster.fr/projets/<id>/us/2`, which needs no linked folder.

`interview add` and `spec-version add` read the standard input, for instance from a heredoc, so nothing needs to be saved to a file:

```sh
specster interview add US-2 <<'EOF'
Question : quel bouton ?
Réponse : « Copier », après la phrase.
EOF
```

`load` prints Markdown: the User Story's sentence, each Interview Entry with its date, then the Spec Version's HTML.

Errors, such as a missing token, a folder linked to no Project or Specster's own refusals, are printed on the standard error, in French, and the command exits with 1.

## Claude Code plugin

This repo is also a Claude Code plugin, `specster`, which runs the CLI for you. Install it in Claude Code:

```
/plugin install specster --marketplace sebastienpalanicaouden/specster-cli
```

It adds three commands, each run by hand:

- `/specster:interview US-n`, at the end of a grilling: saves its questions and answers, word for word, as the next Entry of the User Story's Interview.
- `/specster:meta-spec US-n ["change request"]`: writes the User Story's meta-spec, a functional spec holding a mockup, from its Interview; or, given a sentence, its next version, changed only where the request reaches. You try the draft in your browser, and it is added to Specster as a Spec Version once you approve it.
- `/specster:load US-n [vN]`: loads the User Story, its Interview and a Spec Version, the Current one by default, into the conversation, before `/to-spec` or `/implement` for instance.

They need the same `SPECSTER_TOKEN`, and a folder linked with `specster init` for `US-n`.

## Link a repo

In each repo whose features you keep in Specster:

1. Run `specster init <project URL>` at its root, and commit `.specster.json`. It holds no secret, and every computer then knows the Project.
2. Add these lines to its `CLAUDE.md`, so that specs and tickets name the meta-spec they come from, and `/implement` loads it (the plugin's commands are run by hand, so the agent runs the CLI itself):

   ```md
   ### Meta-specs

   A meta-spec is the Spec Version, in Specster, that specifies a User Story: a functional spec holding a mockup. This repo is linked to its Specster Project by `.specster.json`, so `US-n` names a User Story there.

   - A spec or ticket written from a meta-spec opens with « Meta-spec : US-n vN. Elle fait foi pour l'apparence et le comportement, sauf les exceptions écrites ici ; ses commandes de démonstration ne font pas partie de la feature. », naming the exact version, and lists those exceptions. Each ticket repeats the line, for `/implement` reads the ticket alone.
   - Before implementing a ticket that cites a meta-spec, load that version: `specster load US-n vN`, or `npx --yes github:sebastienpalanicaouden/specster-cli load US-n vN` where `specster` isn't installed. It needs the User's Personal Token in `SPECSTER_TOKEN`; without it, ask the User to set it rather than working from the ticket alone.
   ```
