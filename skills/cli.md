# Running Specster's CLI

The skills of this plugin read and write Specster through its CLI, `specster`, from this repo.

Run `specster` when the command exists (`command -v specster`); otherwise run `npx --yes github:sebastienpalanicaouden/specster-cli` in its place, with the same arguments.

The CLI needs:

- the User's Personal Token in `SPECSTER_TOKEN`. When it is missing, point the User to the README's « Sign in » steps, https://github.com/sebastienpalanicaouden/specster-cli#sign-in, and have them type the token in their own terminal rather than in the conversation;
- for `R-n` and `US-n`, a `.specster.json` in the current folder or one above it, which `specster init <Project URL>` writes. An address works without it: a Release's, such as `https://specster.fr/projets/<id>/releases/3`, or a User Story's, such as `https://specster.fr/projets/<id>/us/2`.

When the CLI exits with 1, its standard error is a message for the User, in French: relay it as it is, with what to do when it says so (create a token, run `init`), and stop there.

**A long output**: when the harness saves the CLI's output to a file and shows only its start, such as « Output too large … Full output saved to: … », read that file whole, in chunks if need be. A Sheet's HTML too large to read whole: read its start, measure its size in the file, and warn the User, naming the Sheet with its size, such as « Attention : F-3 fait 4,2 Mo, je n'ai pu en lire que le début. », where the skill running the command says.

Send text on its standard input through a quoted heredoc whose delimiter the text cannot contain, so the shell keeps every character as it is:

```sh
specster interview add R-2 <<'SPECSTER_END'
…
SPECSTER_END
```
