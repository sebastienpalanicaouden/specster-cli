# Confirming the Release

An Interview Entry and a Spec Version only go with their Release, so the Release comes first. What the arguments name decides the load:

- **`R-n` or a Release's address**: `specster load <R-n>`.
- **`US-n` or a User Story's address**: `specster load <US-n>`, then propose a Release to the User, as its output says:
  - « US-n est dans R-m. »: propose R-m, which the same output already holds;
  - « Aucune Release. »: propose creating one, with a title you suggest from its sentence. Once the User agrees on the title, `specster release create "<title>" <US-n>`, which prints « R-m créée : « … ». », then « US-n ajoutée à R-m. ». Then `specster load <R-m>`.

Read the sentence of every User Story of the Release, under « ## User Stories » in that output, against the need this conversation is about:

- « Cette Release n'a pas encore de User Story. »: Specster refuses an Entry or a version until it has one. Ask the User which User Stories it groups, then `specster release add <R-n> <US-n>…`, and load it again.
- A sentence about another need: ask the User which Release they mean.

Done when the User has agreed on any Release you proposed, and the sentences of all its User Stories match the need.
