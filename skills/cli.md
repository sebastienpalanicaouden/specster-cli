# Running Specster's CLI

The skills of this plugin read and write Specster through its CLI, `specster`, from this repo.

Run `specster` when the command exists (`command -v specster`); otherwise run `npx --yes github:sebastienpalanicaouden/specster-cli` in its place, with the same arguments.

The CLI needs:

- to be connected to Specster. When it says it isn't, « La CLI n'est pas connectée à … : lancez specster login. », or that its stored token was refused, « Le jeton rangé a été refusé (supprimé ou révoqué) : lancez specster login. », run `specster login` yourself, in the background. Give the User the code it prints, and ask them to check it on the page it opens in their browser, or at the address it prints when it opens none, then to click « Autoriser ». Once it prints « Connecté en tant que … », run the command again and carry on. When the CLI says « Le jeton de SPECSTER_TOKEN est refusé : retirez-le ou remplacez-le. », ask the User to remove `SPECSTER_TOKEN` or replace its token, in their own terminal rather than in the conversation: it comes before the token `specster login` stores;
- for `R-n` and `US-n`, a `.specster.json` in the current folder or one above it, which `specster init <Project URL>` writes. An address works without it: a Release's, such as `https://specster.fr/projets/<id>/releases/3`, or a User Story's, such as `https://specster.fr/projets/<id>/us/2`.

Any other time the CLI exits with 1, `specster login` included, its standard error is a message for the User, in French: relay it as it is, with what to do when it says so (run `init`, for instance), and stop there.

**A long output**: when the harness saves the CLI's output to a file and shows only its start, such as « Output too large … Full output saved to: … », read that file whole, in chunks if need be. A Sheet's HTML too large to read whole: read its start, measure its size in the file, and warn the User, naming the Sheet with its size, such as « Attention : F-3 fait 4,2 Mo, je n'ai pu en lire que le début. », where the skill running the command says.

Send text on its standard input through a quoted heredoc whose delimiter the text cannot contain, so the shell keeps every character as it is:

```sh
specster interview add R-2 <<'SPECSTER_END'
…
SPECSTER_END
```
