#!/usr/bin/env node
// Specster from the command line, for a terminal or an agent: links a folder to a Project, and writes the agent's rules
// on its meta-specs and on its Sheets in the folder's CLAUDE.md, then lists its User Stories, creates them and changes
// their sentences, lists and creates its Releases, changes their groups and Tags, adds to their Interviews and Spec
// Versions, writes their Notes, archives them and reads them, whole or as a Brief, writes a User Story's Notes, gives it
// its Labels and archives it, lists and writes the Project's Tasks, marks them done or back to do and links them to its
// User Stories, and lists, reads, creates and changes the Project's Sheets, gives them their Labels and links them to its
// Tasks and to its User Stories, through Specster's API, with the User's Personal Token.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// The file that links a folder, and the folders below it, to a Project.
const CONFIG_FILE = ".specster.json";

const USAGE = `Usage :
  specster init <adresse du projet>   relie ce dossier au projet, et écrit les sections « Meta-specs » et « Fiches »
                                      de son CLAUDE.md
  specster us list                    affiche les User Stories du projet, archivées comprises, avec leur phrase
  specster us create                  crée une User Story dans le projet, avec l'entrée standard pour phrase
  specster us edit <US-n>             remplace la phrase de la User Story par l'entrée standard
  specster release list               affiche les Releases du projet, la plus récente d'abord
  specster release create "<titre>" [US-n…]
                                      crée une Release dans le projet, et y ajoute les User Stories
  specster release add <R-n> <US-n>…  ajoute des User Stories à la Release
  specster release remove <R-n> <US-n>…
                                      retire des User Stories de la Release, sans les supprimer
  specster release tag <R-n> <texte>  pose le tag de la Release, un texte vide le retire
  specster release archive <R-n>      archive la Release, avec ses User Stories
  specster release unarchive <R-n>    désarchive la Release, avec ses User Stories
  specster interview add <R-n>        ajoute l'entrée standard à l'interview de la Release
  specster spec-version add <R-n>     ajoute l'entrée standard, du HTML, comme version de spec de la Release
  specster note add <US-n|R-n>        ajoute l'entrée standard comme note de la User Story ou de la Release
  specster note edit <US-n|R-n> <N>   remplace le texte de la note N par l'entrée standard
  specster note list <US-n|R-n>       affiche les notes de la User Story ou de la Release
  specster label list                 affiche les Labels des User Stories, ceux des Releases et ceux des fiches
  specster label add <US-n|R-n|F-n> <nom>…
                                      pose des Labels de sa liste sur la User Story, la Release ou la fiche
  specster label remove <US-n|R-n|F-n> <nom>…
                                      retire des Labels de la User Story, de la Release ou de la fiche
  specster archive <US-n>             archive la User Story, si elle n'est dans aucune Release
  specster unarchive <US-n>           désarchive la User Story, si elle n'est dans aucune Release
  specster task list [--done]         affiche les tâches à faire du projet, ou ses tâches faites avec --done
  specster task add                   crée une tâche dans le projet, avec l'entrée standard pour texte
  specster task edit <T-n>            remplace le texte de la tâche par l'entrée standard
  specster task delete <T-n>          supprime la tâche, avec ses liens aux User Stories
  specster task done <T-n>            marque la tâche comme faite
  specster task undone <T-n>          remet la tâche à faire
  specster task link <T-n> <US-n>…    relie la tâche aux User Stories
  specster task unlink <T-n> <US-n>…  délie la tâche des User Stories
  specster sheet list                 affiche les fiches du projet, celles en cours puis les archivées
  specster sheet load <F-n>           affiche le HTML de la fiche, sans rien autour
  specster sheet create --title "<titre>"
                                      crée une fiche dans le projet, avec l'entrée standard, du HTML, pour contenu
  specster sheet edit <F-n> [--title "<titre>"]
                                      change le titre de la fiche, remplace son HTML par l'entrée standard, ou les deux
  specster sheet link <F-n> <T-n|US-n>…
                                      relie la fiche aux tâches et aux User Stories
  specster sheet unlink <F-n> <T-n|US-n>…
                                      délie la fiche des tâches et des User Stories
  specster load <R-n> [vN]            affiche la Release, ses User Stories avec leurs notes et leurs tâches,
                                      les fiches reliées sans leur HTML, son interview et une version de spec,
                                      la version courante si vN n'est pas donnée
  specster load <US-n> [vN]           affiche la Release de la User Story, ou, sans Release, sa phrase, ses notes
                                      et ses tâches
  specster brief <R-n>                affiche la Release, ses User Stories avec leurs notes et leurs tâches,
                                      les fiches reliées avec leur HTML, et ses notes

Une User Story se désigne par US-n dans un dossier relié, ou par son adresse.
Une Release se désigne par R-n dans un dossier relié, ou par son adresse.
Une tâche se désigne par T-n, dans un dossier relié seulement.
Une fiche se désigne par F-n dans un dossier relié, ou, pour label add et label remove, par son adresse.
Le jeton personnel, créé dans « Mon compte », se donne dans la variable SPECSTER_TOKEN.`;

// As Specster's pages show them, such as « 29 octobre 2026 à 15:51 », in Paris time.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

// As the « Tâches » page shows a Task's dates, without the time, such as « 9 novembre 2026 », in Paris time.
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

// The agent's instructions, in the folder `init` links, and the two sections it writes there. A CLAUDE.md that already
// has a section under one of these headings keeps it, whatever it says.
const INSTRUCTIONS_FILE = "CLAUDE.md";

// How specs and tickets cite a meta-spec, how an agent loads it, creates User Stories in the words of those already
// there, notes Tasks, archives a Release once delivered and gives it its Tag: word for word what the README gave to
// paste by hand.
const META_SPECS_HEADING = /^### Meta-specs[ \t]*$/m;
const META_SPECS_SECTION = [
  "### Meta-specs",
  "",
  "A meta-spec is the Spec Version, in Specster, that specifies a Release: a functional spec holding a mockup of each screen it changes. This repo is linked to its Specster Project by `.specster.json`, so `R-n` names a Release there and `US-n` a User Story.",
  "",
  "- A spec or ticket written from a meta-spec opens with « Meta-spec : R-n vN. Elle fait foi pour l'apparence et le comportement de ce qu'elle change, l'app réelle pour le reste de chaque écran, sauf les exceptions écrites ici ; ses commandes de démonstration ne font pas partie de la feature. », naming the exact version, and lists those exceptions. Each ticket repeats the line, for `/implement` reads the ticket alone.",
  "- Before implementing a ticket that cites a meta-spec, load that version: `specster load R-n vN`, or `npx --yes github:sebastienpalanicaouden/specster-cli load R-n vN` where `specster` isn't installed. It needs the User's Personal Token in `SPECSTER_TOKEN`; without it, ask the User to set it rather than working from the ticket alone. Older specs and tickets name a User Story instead, which `specster load US-n vN` still reads, through its Release.",
  "- To create a User Story in the linked Project, or change its sentence, run `specster us create`, or `specster us edit US-n`, with the sentence on its standard input, through `npx` and with `SPECSTER_TOKEN` as above. Write the sentence as « En tant que …, je veux …, afin de … », when creating as when editing. When the role, the need or the benefit is missing, ask the User for it rather than inventing it; when all three are there, create or edit without asking for confirmation. Before creating one, run `specster us list` and write the sentence in the words the existing ones use, for the role as for the domain's terms; when one already seems to say the same, name it in one line, such as « US-12 dit déjà : « … ». La créer quand même ? », and create it only once the User says yes.",
  "- To read the Tasks of the linked Project, run `specster task list`, or `specster task list --done` for those done, through `npx` and with `SPECSTER_TOKEN` as above. When the User asks you to note a Task, add it at once with `specster task add`, its text on its standard input. When, while working, you notice something to do outside your current work, propose it in one line, such as « Ajouter la tâche : … ? », and add it only once the User says yes: unlike a User Story, a Task is never added unasked. When you create a User Story from a Task, link them on your own with `specster task link T-n US-n`. Change a Task's text, delete it, mark it done or back to do (`specster task edit T-n`, `task delete T-n`, `task done T-n`, `task undone T-n`) only when the User asks, never on your own.",
  "- After merging a PR, archive each Release it delivers, without waiting for the deploy tag. The tickets the PR closed name their Releases (« Meta-spec : R-n vN »). A Release is delivered once its spec and every ticket citing « Meta-spec : R-n » are closed (check each citation is R-n itself, not R-n0); while one of them is open, it stays in progress. For each one delivered, add its delivery Note, give « merged » to it and to each of its User Stories, archive it, and tell the User in one line: `specster note add R-n` with the Note on its standard input, then `specster label add R-n merged`, then `specster label add US-n merged` for each of its User Stories, then `specster release archive R-n`, through `npx` and with `SPECSTER_TOKEN` as above. If a Label can't be given, for instance because its list has no « merged » Label, archive it all the same and say so in that line. Give no other Label unless the User asks. The Note, in French, on this model:",
  "",
  "  ```",
  "  Livrée par la PR #52 (https://github.com/…/pull/52), squash-mergée en 9b1c2e4, d'après la meta-spec R-3 v2.",
  "  User Stories : US-2, US-3, US-5.",
  "  Spec : #49. Tickets : #50, #51.",
  "  Écarts avec la meta-spec : aucun.",
  "  Reste à faire : rien.",
  "  ```",
  "",
  "  Dates may be added where they help; the Tag stays out, as it comes after the deployment. A Note to correct is read with `specster note list R-n` and replaced with `specster note edit R-n <N>`, its number.",
  "- After a successful deployment, run `specster release tag R-n vX.Y.Z` for each Archived Release with no Tag that has « merged », whatever its case: `specster release list` shows them. A canceled Release has no « merged », so it stays without a Tag.",
].join("\n");

// When an agent creates, changes, reads and links a Sheet, and gives it its Labels.
const SHEETS_HEADING = /^### Fiches[ \t]*$/m;
const SHEETS_SECTION = [
  "### Fiches",
  "",
  "A Sheet, « Fiche » on screen, is a title and an HTML document that the linked Specster Project keeps outside any Release, such as an audit or a research; `F-n` names one there. Its commands are `specster sheet …`, or `npx --yes github:sebastienpalanicaouden/specster-cli sheet …` where `specster` isn't installed, with the User's Personal Token in `SPECSTER_TOKEN`; without it, ask the User to set it.",
  "",
  "- Create a Sheet, or change one, when the User asks: `specster sheet create --title \"<title>\"`, its HTML on the standard input, and `specster sheet edit F-n`, with `--title \"<title>\"` for a new title, an HTML on the standard input for a new HTML, or both. When, while working, you produce something worth keeping as a Sheet, or see one to change, propose it in one line, such as « Enregistrer une Fiche : … ? », and act only once the User says yes.",
  "- A Sheet has no versions: `sheet edit` replaces its HTML without a question, and the old one is lost. So before each replacement, even one the User asked for, ask for their agreement in the conversation, recalling that the HTML the Sheet has will be lost. One agreement covers one replacement: ask again for the next. A title changed alone loses nothing, so it takes no such question.",
  "- Read a Sheet's HTML, with `specster sheet load F-n`, when the User names that Sheet or your work depends on it, and only then; `specster sheet list` prints their titles and their links.",
  "- When you create a Task or a User Story from a Sheet, link them on your own with `specster sheet link F-n T-n` or `specster sheet link F-n US-n`.",
  "- Give a Sheet a Label, or take one from it, only when the User asks: `specster label add F-n <label>`, `specster label remove F-n <label>`.",
  "- Marking a Sheet as a Favorite, archiving it, unarchiving it and deleting it are the User's, on its page: when asked for one, say so.",
].join("\n");

// How a Sheet's HTML is sent, kept byte for byte.
const HTML = "text/html; charset=utf-8";

// The colors of Labels, in French. A key missing here, from a Specster newer than the CLI, is shown as it is.
const COLOR_NAMES = new Map([
  ["gray", "gris"],
  ["red", "rouge"],
  ["orange", "orange"],
  ["yellow", "jaune"],
  ["green", "vert"],
  ["blue", "bleu"],
  ["purple", "violet"],
  ["pink", "rose"],
]);

// A message for the User, printed as it is, without a stack trace.
class UserError extends Error {}

const COMMANDS = {
  init,
  "us list": listUserStories,
  "us create": createUserStory,
  "us edit": editUserStory,
  "release list": listReleases,
  "release create": createRelease,
  "release add": addToRelease,
  "release remove": removeFromRelease,
  "release tag": tagRelease,
  "release archive": archiveRelease,
  "release unarchive": unarchiveRelease,
  "interview add": addInterviewEntry,
  "spec-version add": addSpecVersion,
  "note add": addNote,
  "note edit": editNote,
  "note list": listNotes,
  "label list": listLabels,
  "label add": addLabels,
  "label remove": removeLabels,
  archive,
  unarchive,
  "task list": listTasks,
  "task add": addTask,
  "task edit": editTask,
  "task delete": deleteTask,
  "task done": markTaskDone,
  "task undone": markTaskToDo,
  "task link": linkTask,
  "task unlink": unlinkTask,
  "sheet list": listSheets,
  "sheet load": loadSheet,
  "sheet create": createSheet,
  "sheet edit": editSheet,
  "sheet link": linkSheet,
  "sheet unlink": unlinkSheet,
  load,
  brief,
};

try {
  const args = process.argv.slice(2);
  // Commands take one word or two, such as « load » or « interview add ».
  const name = [args.slice(0, 2).join(" "), args[0]].find((candidate) => Object.hasOwn(COMMANDS, candidate ?? ""));
  if (!name) throw new UserError(USAGE);
  await COMMANDS[name](args.slice(name.split(" ").length));
} catch (error) {
  if (!(error instanceof UserError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
}

// Writes the folder's link to the Project whose address the User copied from their browser, and the « Meta-specs » and
// « Fiches » sections of its CLAUDE.md, each unless it is already there.
async function init([address]) {
  const match = /^(https?:\/\/[^/]+)\/projets\/([0-9a-f-]{36})(?:\/|$)/i.exec(address ?? "");
  if (!match) throw new UserError(`Donnez l'adresse du projet, copiée dans le navigateur.\n\n${USAGE}`);
  const [, url, project] = match;
  writeFileSync(CONFIG_FILE, `${JSON.stringify({ url, project }, null, 2)}\n`);
  console.log(`Ce dossier est relié au projet ${project} de ${url}.`);
  for (const name of writeInstructionSections()) {
    console.log(`La section « ${name} » est ajoutée à ${INSTRUCTIONS_FILE}.`);
  }
}

// Adds to the folder's CLAUDE.md, created if missing, each of the two sections whose heading it lacks: « Meta-specs » at
// its end, as a User pasting it would, then « Fiches » right after the « Meta-specs » section, that is before the next
// heading of that level or above, or at the end without one. The rest of the file stays byte for byte, and so does all
// of it when it has both headings. Gives the names of the sections it wrote.
function writeInstructionSections() {
  const before = existsSync(INSTRUCTIONS_FILE) ? readFileSync(INSTRUCTIONS_FILE, "utf8") : "";
  let instructions = before;
  const written = [];
  if (!META_SPECS_HEADING.test(instructions)) {
    instructions = withSection(instructions, instructions.length, META_SPECS_SECTION);
    written.push("Meta-specs");
  }
  if (!SHEETS_HEADING.test(instructions)) {
    const metaSpecs = META_SPECS_HEADING.exec(instructions);
    const afterHeading = metaSpecs.index + metaSpecs[0].length;
    const nextHeading = instructions.slice(afterHeading).search(/^#{1,3} /m);
    const at = nextHeading === -1 ? instructions.length : afterHeading + nextHeading;
    instructions = withSection(instructions, at, SHEETS_SECTION);
    written.push("Fiches");
  }
  if (instructions !== before) writeFileSync(INSTRUCTIONS_FILE, instructions);
  return written;
}

// The instructions with the section put in at this place, a blank line parting it from what comes before it, and from
// what follows.
function withSection(instructions, at, section) {
  const before = instructions.slice(0, at);
  const gap = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const after = instructions.slice(at);
  return `${before}${gap}${section}\n${after === "" ? "" : `\n${after}`}`;
}

// All the linked Project's User Stories, archived ones included, in the order of their numbers, for an agent to read
// before writing a new one: « US-3 · archivée · » or « US-3 · », then its sentence as written, line breaks included, and
// a blank line between two, so that each one's end shows. Without any, the page's message.
async function listUserStories(args) {
  if (args.length > 0) throw new UserError(USAGE);
  const { url, project } = linkedProject();
  const { userStories } = await api(url, `/api/projets/${project}/us`);
  if (userStories.length === 0) {
    console.log("Ce projet n'a pas encore de User Story.");
    return;
  }
  console.log(
    userStories
      .map(({ number, sentence, archivedAt }) => [`US-${number}`, ...(archivedAt ? ["archivée"] : []), sentence].join(" · "))
      .join("\n\n"),
  );
}

// Creates a User Story in the linked Project, in no Release, with what comes on the standard input as its sentence, and
// says it as Specster saved it. Neither the CLI nor Specster checks its form.
async function createUserStory(args) {
  refuseSentenceAsArgument(args);
  const { url, project } = linkedProject();
  const created = await api(url, `/api/projets/${project}/us`, { method: "POST", ...(await plainTextInput()) });
  console.log(`US-${created.number} créée : « ${created.sentence} ».`);
}

// Replaces the User Story's sentence with what comes on the standard input. Asking again changes nothing.
async function editUserStory([reference, ...others]) {
  const userStory = userStoryAt(reference);
  refuseSentenceAsArgument(others);
  await api(userStory.url, `${userStory.path}/sentence`, { method: "PUT", ...(await plainTextInput()) });
  console.log(`${userStory.name} modifiée.`);
}

// A sentence given as an argument, as `release create` takes its title, would be lost in silence: Specster would refuse
// the empty standard input as an empty sentence, or a terminal would wait for one.
function refuseSentenceAsArgument(args) {
  if (args.length > 0) {
    throw new UserError(`Donnez la phrase de la User Story sur l'entrée standard, pas en argument.\n\n${USAGE}`);
  }
}

// The linked Project's Releases, the most recent first, one line each.
async function listReleases() {
  const { url, project } = linkedProject();
  const { releases } = await api(url, `/api/projets/${project}/releases`);
  if (releases.length === 0) {
    console.log("Ce projet n'a pas encore de Release.");
    return;
  }
  console.log(
    releases
      .map(({ number, title, tag, archivedAt, userStories, labels }) => {
        const group = userStories.map((userStory) => `US-${userStory}`).join(", ") || "aucune User Story";
        const archived = archivedAt ? ["archivée"] : [];
        const tagged = tag ? [`tag ${tag}`] : [];
        const labelled = labels.length > 0 ? [labels.join(", ")] : [];
        return [`R-${number}`, title, ...archived, ...tagged, group, ...labelled].join(" · ");
      })
      .join("\n"),
  );
}

// Creates a Release in the linked Project, then adds the User Stories named, in a second request: when they are refused,
// the Release stays, already announced. Without a title, Specster's refusal says to write one.
async function createRelease([title = "", ...references]) {
  const numbers = references.length > 0 ? userStoryNumbers(references) : [];
  const { url, project } = linkedProject();
  const releases = `/api/projets/${project}/releases`;
  const created = await api(url, releases, { method: "POST", body: JSON.stringify({ title }), contentType: "application/json" });
  console.log(`R-${created.number} créée : « ${created.title} ».`);
  if (numbers.length > 0) {
    await changeGroup({ name: `R-${created.number}`, url, path: `${releases}/${created.number}` }, "add", numbers);
  }
}

// Adds the User Stories to the Release, all or none. Asking again changes nothing.
async function addToRelease([reference, ...references]) {
  const release = releaseAt(reference);
  await changeGroup(release, "add", userStoryNumbers(references));
}

// Takes the User Stories out of the Release, all or none, without deleting them. Asking again changes nothing.
async function removeFromRelease([reference, ...references]) {
  const release = releaseAt(reference);
  await changeGroup(release, "remove", userStoryNumbers(references));
}

// Sends the change, and says what it did to each User Story, in the order the User named them, then the warning, if the
// group now differs from what the Current Spec Version covers.
async function changeGroup(release, change, numbers) {
  const { userStories, groupChange } = await api(release.url, `${release.path}/user-stories`, {
    method: "PATCH",
    body: JSON.stringify({ [change]: numbers }),
    contentType: "application/json",
  });
  const said =
    change === "add"
      ? (name, changed) => (changed ? `${name} ajoutée à ${release.name}.` : `${name} était déjà dans ${release.name}.`)
      : (name, changed) => (changed ? `${name} retirée de ${release.name}.` : `${name} n'était pas dans ${release.name}.`);
  console.log(userStories.map(({ number, changed }) => said(`US-${number}`, changed)).join("\n"));
  if (groupChange) console.log(groupChange);
}

// Gives the Release the Tag the User writes, as a single argument, so that no part of it goes missing, or takes it off
// with an empty one. Asking again changes nothing.
async function tagRelease([reference, text, ...others]) {
  const release = releaseAt(reference);
  if (text === undefined || others.length > 0) {
    throw new UserError(`Donnez le texte du tag, comme v1.9.0, ou "" pour le retirer.\n\n${USAGE}`);
  }
  const { tag } = await api(release.url, `${release.path}/tag`, {
    method: "PUT",
    body: text,
    contentType: "text/plain; charset=utf-8",
  });
  console.log(tag === null ? `Tag de ${release.name} retiré.` : `Tag de ${release.name} : ${tag}.`);
}

// Archives the Release with its User Stories. A program may ask again: an Archived Release stays as it is.
async function archiveRelease([reference]) {
  const release = releaseAt(reference);
  const { changed, userStories } = await api(release.url, `${release.path}/archive`, { method: "PUT" });
  console.log(
    changed ? `${release.name} archivée${withUserStories(userStories)}.` : `${release.name} était déjà archivée.`,
  );
}

// Unarchives the Release with its User Stories. Asking again changes nothing.
async function unarchiveRelease([reference]) {
  const release = releaseAt(reference);
  const { changed, userStories } = await api(release.url, `${release.path}/archive`, { method: "DELETE" });
  console.log(
    changed ? `${release.name} désarchivée${withUserStories(userStories)}.` : `${release.name} n'était pas archivée.`,
  );
}

// What follows the Release in a sentence, such as « , avec US-2, US-3 et US-5 », and nothing for an empty one.
function withUserStories(numbers) {
  if (numbers.length === 0) return "";
  return `, avec ${new Intl.ListFormat("fr").format(numbers.map((number) => `US-${number}`))}`;
}

// The numbers of the User Stories a change of a group names, all of them by US-n: the Release says which Project.
function userStoryNumbers(references) {
  const numbers = references.map((reference) => /^US-([1-9][0-9]*)$/i.exec(reference)?.[1]);
  if (numbers.length === 0 || numbers.includes(undefined)) {
    throw new UserError(`Désignez les User Stories par US-n.\n\n${USAGE}`);
  }
  return numbers.map(Number);
}

// Adds what comes on the standard input, word for word, as the next Entry of the Release's Interview. A User Story named
// instead goes to Specster all the same, whose refusal says which Release to use.
async function addInterviewEntry([reference]) {
  const target = namedUserStory(reference) ?? releaseAt(reference);
  await api(target.url, `${target.path}/interview`, { method: "POST", ...(await plainTextInput()) });
  console.log(`Ajout enregistré dans l'interview de ${target.name}.`);
}

// Adds what comes on the standard input, HTML kept byte for byte, as the Release's next Spec Version. A User Story named
// instead goes to Specster all the same, whose refusal says which Release to use.
async function addSpecVersion([reference]) {
  const target = namedUserStory(reference) ?? releaseAt(reference);
  const { number } = await api(target.url, `${target.path}/v`, {
    method: "POST",
    body: await standardInput(),
    contentType: "text/html; charset=utf-8",
  });
  console.log(`${target.name} v${number} ajoutée : c'est la Version courante.`);
}

// Adds what comes on the standard input, word for word, as the next Note of the User Story or the Release.
async function addNote([reference]) {
  const target = userStoryOrReleaseAt(reference);
  const { number } = await api(target.url, `${target.path}/notes`, { method: "POST", ...(await plainTextInput()) });
  console.log(`Note ${number} ajoutée à ${target.name}.`);
}

// Replaces the text of the Note of the User Story or the Release, named by its number, with what comes on the standard
// input.
async function editNote([reference, number]) {
  const target = userStoryOrReleaseAt(reference);
  if (!/^[1-9][0-9]*$/.test(number ?? "")) throw new UserError(`Désignez la note par son numéro, comme 2.\n\n${USAGE}`);
  await api(target.url, `${target.path}/notes/${number}`, { method: "PUT", ...(await plainTextInput()) });
  console.log(`Note ${number} de ${target.name} modifiée.`);
}

// The Notes of the User Story or the Release, oldest first, in Markdown: each under its number and dates, such as
// before changing one.
async function listNotes([reference]) {
  const target = userStoryOrReleaseAt(reference);
  const { notes } = await api(target.url, `${target.path}/notes`);
  if (notes.length === 0) {
    console.log(`Cette ${namesRelease(reference) ? "Release" : "User Story"} n'a pas encore de note.`);
    return;
  }
  const listed = notes.map(({ number, text, createdAt, editedAt }) => {
    const edited = editedAt ? ` (modifiée le ${DATE_FORMAT.format(new Date(editedAt))})` : "";
    // Without the line break a heredoc ends with, which would double the blank line before the next Note.
    return `### Note ${number} · ajoutée le ${DATE_FORMAT.format(new Date(createdAt))}${edited}\n\n${text.replace(/\n+$/, "")}`;
  });
  console.log(listed.join("\n\n"));
}

// The linked Project's three lists of Labels, apart, each in alphabetical order, with their colors. A Specster older than
// the Sheets' Labels serves their path as a Sheet's, which it doesn't find: the two others are then printed alone.
async function listLabels() {
  const { url, project } = linkedProject();
  const [ofUserStories, ofReleases, ofSheets] = await Promise.all([
    api(url, `/api/projets/${project}/labels`),
    api(url, `/api/projets/${project}/releases/labels`),
    api(url, `/api/projets/${project}/fiches/labels`, { ifNotFound: null }),
  ]);
  const lines = (labels) =>
    labels.length > 0 ? labels.map(({ name, color }) => `${name} · ${COLOR_NAMES.get(color) ?? color}`) : ["Aucun Label."];
  console.log(
    [
      "Labels des User Stories :",
      ...lines(ofUserStories.labels),
      "Labels des Releases :",
      ...lines(ofReleases.labels),
      ...(ofSheets ? ["Labels des fiches :", ...lines(ofSheets.labels)] : []),
    ].join("\n"),
  );
}

// Gives the User Story, the Release or the Sheet, archived or not, the Labels of its list the User names. Asking again
// changes nothing.
async function addLabels(args) {
  await changeLabels("add", args, (targetName, name, changed) =>
    changed ? `Label « ${name} » ajouté à ${targetName}.` : `${targetName} avait déjà le Label « ${name} ».`,
  );
}

// Takes the named Labels off the User Story, the Release or the Sheet. Asking again changes nothing.
async function removeLabels(args) {
  await changeLabels("remove", args, (targetName, name, changed) =>
    changed ? `Label « ${name} » retiré de ${targetName}.` : `${targetName} n'avait pas le Label « ${name} ».`,
  );
}

// One request for all the names, so that an unknown one changes nothing for the others. One line for each Label.
async function changeLabels(change, [reference, ...names], lineFor) {
  const target = labelTargetAt(reference);
  if (names.length === 0) throw new UserError(`Donnez au moins un nom de Label, comme merged.\n\n${USAGE}`);
  const { labels } = await api(target.url, `${target.path}/labels`, {
    method: "PATCH",
    body: JSON.stringify({ [change]: names }),
    contentType: "application/json",
  });
  console.log(labels.map(({ name, changed }) => lineFor(target.name, name, changed)).join("\n"));
}

// Archives the User Story. A program may ask again: an Archived User Story stays as it is.
async function archive([reference]) {
  const userStory = userStoryAt(reference);
  const { changed } = await api(userStory.url, `${userStory.path}/archive`, { method: "PUT" });
  console.log(changed ? `${userStory.name} archivée.` : `${userStory.name} était déjà archivée.`);
}

// Unarchives the User Story, which goes back to its place in its Project's list. Asking again changes nothing.
async function unarchive([reference]) {
  const userStory = userStoryAt(reference);
  const { changed } = await api(userStory.url, `${userStory.path}/archive`, { method: "DELETE" });
  console.log(changed ? `${userStory.name} désarchivée.` : `${userStory.name} n'était pas archivée.`);
}

// The linked Project's Tasks to do, or those done with --done, in the order of their tab on the « Tâches » page: a block of
// Markdown each, with its whole text, its state, its User Stories and, when it has some, its Sheets. Without any, the
// page's message.
async function listTasks(args) {
  const done = args.length === 1 && args[0] === "--done";
  if (args.length > 0 && !done) throw new UserError(USAGE);
  const { url, project } = linkedProject();
  const { tasks } = await api(url, `/api/projets/${project}/taches`);
  const listed = tasks.filter(({ doneAt }) => (doneAt !== null) === done);
  if (listed.length === 0) {
    const none = done ? "Aucune tâche faite." : "Aucune tâche à faire.";
    console.log(tasks.length === 0 ? "Ce projet n'a pas encore de tâche." : none);
    return;
  }
  console.log(
    listed
      .map((task) =>
        // A Specster older than the Sheets gives none.
        taskBlock(task, {
          level: 2,
          userStories: task.userStories.map(userStoryPill),
          sheets: (task.sheets ?? []).map(sheetPill),
        }),
      )
      .join("\n\n"),
  );
}

// A Task as a block of Markdown, under a heading of the level given: its number and its state, then a line with its
// dates and, when given, its User Stories as they are written, and its Sheets when some are given, then its whole
// text, as typed.
function taskBlock({ number, text, createdAt, editedAt, doneAt }, { level, userStories, sheets = [] }) {
  const state = doneAt === null ? "À faire" : `Faite le ${DAY_FORMAT.format(new Date(doneAt))}`;
  const line = [
    ...addedAndEditedDays({ createdAt, editedAt }),
    ...(userStories === undefined ? [] : [`User Stories : ${userStories.join(", ") || "aucune"}`]),
    ...(sheets.length === 0 ? [] : [`Fiches : ${sheets.join(", ")}`]),
  ].join(" · ");
  // Without the line break a heredoc ends with, which would double the blank line before the next Task.
  return `${"#".repeat(level)} T-${number} · ${state}\n${line}\n\n${text.replace(/\n+$/, "")}`;
}

// How the line of a Task or of a linked Sheet starts: the day it was added, then, once it has been changed, the day it
// last was, without the time.
function addedAndEditedDays({ createdAt, editedAt }) {
  return [
    `Ajoutée le ${DAY_FORMAT.format(new Date(createdAt))}`,
    ...(editedAt === null ? [] : [`modifiée le ${DAY_FORMAT.format(new Date(editedAt))}`]),
  ];
}

// A User Story linked to a Task, as its pill on the « Tâches » page shows it: « US-26 · Archivée » once archived, « US-36 ·
// R-15 » in a Release, « US-35 » in none.
function userStoryPill({ number, release, archivedAt }) {
  if (archivedAt !== null) return `US-${number} · Archivée`;
  return release === null ? `US-${number}` : `US-${number} · R-${release}`;
}

// A Sheet linked to a Task, as its pill on the « Tâches » page shows it: « F-5 · Archivée » once archived, « F-3 » until then.
function sheetPill({ number, archivedAt }) {
  return archivedAt === null ? `F-${number}` : `F-${number} · Archivée`;
}

// Adds what comes on the standard input, word for word, as a Task to do in the linked Project, and prints its number
// alone, for an agent to use.
async function addTask(args) {
  refuseTaskTextAsArgument(args);
  const { url, project } = linkedProject();
  const created = await api(url, `/api/projets/${project}/taches`, { method: "POST", ...(await plainTextInput()) });
  console.log(`T-${created.number}`);
}

// Replaces the Task's text with what comes on the standard input. Its text unchanged changes nothing.
async function editTask([reference, ...others]) {
  const task = taskAt(reference);
  refuseTaskTextAsArgument(others);
  await api(task.url, task.path, { method: "PUT", ...(await plainTextInput()) });
  console.log(`${task.name} modifiée.`);
}

// A text given as an argument would be lost in silence, as a User Story's sentence would.
function refuseTaskTextAsArgument(args) {
  if (args.length > 0) {
    throw new UserError(`Donnez le texte de la tâche sur l'entrée standard, pas en argument.\n\n${USAGE}`);
  }
}

// Deletes the Task for good, with its links to User Stories, which stay.
async function deleteTask(args) {
  const task = onlyTaskAt(args);
  await api(task.url, task.path, { method: "DELETE" });
  console.log(`${task.name} supprimée.`);
}

// Marks the Task done. A program may ask again: a done Task keeps the date it was first done.
async function markTaskDone(args) {
  const task = onlyTaskAt(args);
  const { changed } = await api(task.url, `${task.path}/done`, { method: "PUT" });
  console.log(changed ? `${task.name} marquée comme faite.` : `${task.name} était déjà faite.`);
}

// Puts the Task back to do. Asking again changes nothing.
async function markTaskToDo(args) {
  const task = onlyTaskAt(args);
  const { changed } = await api(task.url, `${task.path}/done`, { method: "DELETE" });
  console.log(changed ? `${task.name} remise à faire.` : `${task.name} était déjà à faire.`);
}

// Links the Task to the User Stories, archived or not, all or none. Asking again changes nothing.
async function linkTask([reference, ...references]) {
  await changeTaskLinks(taskAt(reference), "add", userStoryNumbers(references), (task, userStory, changed) =>
    changed ? `${task} reliée à ${userStory}.` : `${task} était déjà reliée à ${userStory}.`,
  );
}

// Unlinks the Task from the User Stories, all or none, without deleting them. Asking again changes nothing.
async function unlinkTask([reference, ...references]) {
  await changeTaskLinks(taskAt(reference), "remove", userStoryNumbers(references), (task, userStory, changed) =>
    changed ? `${task} déliée de ${userStory}.` : `${task} n'était pas reliée à ${userStory}.`,
  );
}

// One request for all the User Stories, so that one not found changes nothing for the others. One line for each, in the
// order the User named them.
async function changeTaskLinks(task, change, numbers, lineFor) {
  const { userStories } = await api(task.url, `${task.path}/user-stories`, {
    method: "PATCH",
    body: JSON.stringify({ [change]: numbers }),
    contentType: "application/json",
  });
  console.log(userStories.map(({ number, changed }) => lineFor(task.name, `US-${number}`, changed)).join("\n"));
}

// The Task a command names alone: anything after it gets the same refusal, so that no argument is ignored in silence.
function onlyTaskAt([reference, ...others]) {
  return taskAt(others.length === 0 ? reference : null);
}

// Where the API keeps the Task the User names, as T-n in a linked folder: a Task has no address of its own.
function taskAt(reference) {
  const number = /^T-([1-9][0-9]*)$/i.exec(reference ?? "")?.[1];
  if (!number) throw new UserError(`Désignez la tâche par T-n.\n\n${USAGE}`);
  const { url, project } = linkedProject();
  return { name: `T-${number}`, url, path: `/api/projets/${project}/taches/${number}` };
}

// The linked Project's Sheets, those in progress in the order of its « Fiches » page, then the Archived Sheets: two lines
// each, its number and its title, then its dates, as its page writes them, and, only when they apply, « Favorite », when
// it was archived, its Tasks, its User Stories and its Labels. Without any, the page's message.
async function listSheets(args) {
  if (args.length > 0) throw new UserError(USAGE);
  const { url, project } = linkedProject();
  const { sheets } = await api(url, `/api/projets/${project}/fiches`);
  if (sheets.length === 0) {
    console.log("Ce projet n'a pas encore de fiche.");
    return;
  }
  console.log(sheets.map(sheetBlock).join("\n\n"));
}

// A Specster older than the Sheet Labels gives no `labels`: the line then names none.
function sheetBlock({ number, title, favorite, createdAt, editedAt, archivedAt, tasks, userStories, labels = [] }) {
  const line = [
    `Créée le ${DATE_FORMAT.format(new Date(createdAt))}`,
    ...(editedAt === null ? [] : [`modifiée le ${DATE_FORMAT.format(new Date(editedAt))}`]),
    ...(favorite ? ["Favorite"] : []),
    ...(archivedAt === null ? [] : [`Archivée le ${DATE_FORMAT.format(new Date(archivedAt))}`]),
    ...(tasks.length === 0 ? [] : [`Tâches : ${tasks.map((task) => `T-${task.number}`).join(", ")}`]),
    ...(userStories.length === 0
      ? []
      : [`User Stories : ${userStories.map((userStory) => `US-${userStory.number}`).join(", ")}`]),
    ...labelsLine(labels),
  ].join(" · ");
  return `F-${number} · ${title}\n${line}`;
}

// Prints the Sheet's HTML alone, byte for byte as Specster keeps it, so that it can be redirected to a file.
async function loadSheet([reference, ...others]) {
  // Anything after the Sheet gets the same refusal, so that no argument is ignored in silence.
  const sheet = sheetAt(others.length === 0 ? reference : null);
  process.stdout.write(await api(sheet.url, sheet.path, { as: "bytes" }));
}

// Creates a Sheet in the linked Project, under the title given with --title, with what comes on the standard input, HTML
// kept byte for byte, as its content.
async function createSheet(args) {
  const { title, others } = titleOption(args);
  if (title === undefined || others.length > 0) {
    throw new UserError(
      `Donnez le titre de la fiche avec --title "<titre>", et son HTML sur l'entrée standard.\n\n${USAGE}`,
    );
  }
  const { url, project } = linkedProject();
  const created = await api(url, `/api/projets/${project}/fiches?${titleQuery(title)}`, {
    method: "POST",
    body: await standardInput(),
    contentType: HTML,
  });
  console.log(`F-${created.number} créée.`);
}

// Changes the Sheet's title, given with --title, replaces its HTML with what comes on the standard input, or both in one
// request, both or neither. A terminal, or an empty standard input, gives no HTML, and the Sheet keeps its own: the HTML
// it had is lost once replaced, and the CLI asks nothing before.
async function editSheet(args) {
  const { title, others } = titleOption(args);
  const sheet = sheetAt(others.length === 1 ? others[0] : null);
  const html = process.stdin.isTTY ? Buffer.alloc(0) : await standardInput();
  if (title === undefined && html.length === 0) {
    throw new UserError(
      `Donnez un nouveau titre avec --title "<titre>", un nouveau HTML sur l'entrée standard, ou les deux.\n\n${USAGE}`,
    );
  }
  await api(sheet.url, title === undefined ? sheet.path : `${sheet.path}?${titleQuery(title)}`, {
    method: "PATCH",
    ...(html.length > 0 && { body: html, contentType: HTML }),
  });
  console.log(`${sheet.name} modifiée.`);
}

// Links the Sheet, archived or not, to the Tasks and the User Stories, whatever their state, all or none. Asking again
// changes nothing.
async function linkSheet([reference, ...references]) {
  await changeSheetLinks(sheetAt(reference), "add", references, (sheet, linked, changed) =>
    changed ? `${sheet} reliée à ${linked}.` : `${sheet} était déjà reliée à ${linked}.`,
  );
}

// Unlinks the Sheet from the Tasks and the User Stories, all or none, without deleting them. Asking again changes nothing.
async function unlinkSheet([reference, ...references]) {
  await changeSheetLinks(sheetAt(reference), "remove", references, (sheet, linked, changed) =>
    changed ? `${sheet} déliée de ${linked}.` : `${sheet} n'était pas reliée à ${linked}.`,
  );
}

// One request for all the Tasks and the User Stories, so that one not found changes nothing for the others. One line for
// each, in the order the User named them, and once for one named twice.
async function changeSheetLinks(sheet, change, references, lineFor) {
  // All of them by T-n or US-n: the Sheet says which Project.
  const named = references.map((reference) => /^(T|US)-([1-9][0-9]*)$/i.exec(reference));
  if (named.length === 0 || named.includes(null)) {
    throw new UserError(`Désignez les tâches et les User Stories par T-n ou US-n.\n\n${USAGE}`);
  }
  const numbers = { tasks: [], userStories: [] };
  for (const [, prefix, number] of named) {
    numbers[prefix.toUpperCase() === "T" ? "tasks" : "userStories"].push(Number(number));
  }
  const { tasks, userStories } = await api(sheet.url, `${sheet.path}/liens`, {
    method: "PATCH",
    body: JSON.stringify({ [change]: numbers }),
    contentType: "application/json",
  });
  const changed = new Map([
    ...tasks.map((task) => [`T-${task.number}`, task.changed]),
    ...userStories.map((userStory) => [`US-${userStory.number}`, userStory.changed]),
  ]);
  const names = new Set(named.map(([, prefix, number]) => `${prefix.toUpperCase()}-${number}`));
  console.log([...names].map((name) => lineFor(sheet.name, name, changed.get(name))).join("\n"));
}

// The title --title gives, even empty, which Specster then refuses, and the other arguments. Without the option, or
// with it twice or with nothing after it, no title.
function titleOption(args) {
  const at = args.indexOf("--title");
  if (at === -1 || at === args.length - 1) return { title: undefined, others: args };
  const others = args.toSpliced(at, 2);
  return others.includes("--title") ? { title: undefined, others: args } : { title: args[at + 1], others };
}

// How the API takes a Sheet's title: in the address, as the request's body holds its HTML.
function titleQuery(title) {
  return new URLSearchParams({ titre: title }).toString();
}

// Where the API keeps the Sheet the User names, as F-n in a linked folder: the sheet commands take no address for one,
// unlike label add and label remove.
function sheetAt(reference) {
  const sheet = /^F-/i.test(reference ?? "") ? namedSheet(reference) : null;
  if (!sheet) throw new UserError(`Désignez la fiche par F-n.\n\n${USAGE}`);
  return sheet;
}

function namedSheet(reference) {
  return named(reference, "F", "fiches");
}

// Where the API keeps the Sheet of this number in the Project.
function sheetPath(project, number) {
  return `/api/projets/${project}/fiches/${number}`;
}

// What an agent reads before working on the Release or the User Story. A User Story in a Release leads to it, as it holds
// its Interview and its Spec Versions. Nothing is printed unless all of it can be.
async function load([reference, version]) {
  const target = namesRelease(reference) ? releaseAt(reference) : userStoryAt(reference);
  const asked = version === undefined ? null : /^v?([1-9][0-9]*)$/i.exec(version)?.[1];
  if (asked === undefined) throw new UserError(`Désignez la version de spec par vN, comme v2.\n\n${USAGE}`);
  const shown = asked === null ? null : Number(asked);
  console.log(namesRelease(reference) ? await loadedRelease(target, shown) : await loadedUserStory(target, shown));
}

// The Release as `load` prints it, with the Spec Version asked for, or the Current Spec Version, then the warning, if the
// group differs from what the Current Spec Version covers. The Notes it shows are those of its User Stories: its own are
// for note list.
async function loadedRelease(release, asked) {
  const { number, title, tag, archivedAt, labels, userStories, tasks, sheets, currentSpecVersion, specVersions, groupChange } =
    await api(release.url, release.path);
  const shown = asked ?? currentSpecVersion;
  const covered = specVersions.find((specVersion) => specVersion.number === shown)?.covers;
  if (shown !== null && !covered) throw new UserError(`${release.name} n'a pas de v${shown}.`);
  const { entries } = await api(release.url, `${release.path}/interview`);
  const interview =
    entries.length === 0
      ? ["Cette Release n'a pas encore d'interview."]
      : entries.map(({ text, createdAt }) => `### Ajout du ${DATE_FORMAT.format(new Date(createdAt))}\n\n${text}`);
  const specVersion =
    shown === null
      ? ["## Version de spec", "Cette Release n'a pas encore de version de spec."]
      : [
          `## Version de spec v${shown} (${shown === currentSpecVersion ? "Version courante, " : ""}couvre ${covered
            .map((userStory) => `US-${userStory}`)
            .join(", ")})`,
          await api(release.url, `${release.path}/v/${shown}`, { as: "text" }),
        ];
  return [
    ...releaseHeading({ number, title, archivedAt }),
    `Tag : ${tag ?? "aucun"}`,
    ...labelsLine(labels),
    ...userStoriesSection(userStories),
    ...linkedTasksSection(tasks, { ofRelease: true }),
    ...linkedSheetsSection(sheets, { html: false }),
    "## Interview",
    ...interview,
    ...specVersion,
    ...(groupChange ? [groupChange] : []),
  ].join("\n\n");
}

// The Release of the User Story as `load` prints it, or, without one, all that the User Story has: no Spec Version.
async function loadedUserStory(userStory, asked) {
  const { number, sentence, archivedAt, labels, release, tasks } = await api(userStory.url, userStory.path);
  if (release !== null) {
    const releasePath = userStory.path.replace(/\/us\/[0-9]+$/, `/releases/${release}`);
    const loaded = await loadedRelease({ name: `R-${release}`, url: userStory.url, path: releasePath }, asked);
    return `US-${number} est dans R-${release}.\n\n${loaded}`;
  }
  if (asked !== null) throw new UserError(`US-${number} n'est dans aucune Release : elle n'a pas de v${asked}.`);
  const { notes } = await api(userStory.url, `${userStory.path}/notes`);
  return [
    `# US-${number} · ${sentence}`,
    ...archivedLine(archivedAt),
    ...labelsLine(labels),
    "Aucune Release.",
    ...notes.map(noteLine),
    ...linkedTasksSection(tasks, { ofRelease: false }),
  ].join("\n\n");
}

// The Brief: what the Release says of its need, for an agent to read alone before a grilling, with the whole HTML of the
// Sheets linked to its User Stories. Its Interview is read only to count its Entries. Nothing is printed unless all of it
// can be.
async function brief([reference, ...others]) {
  // Anything after the Release gets the same refusal, so that no argument is ignored in silence.
  const release = releaseAt(others.length === 0 ? reference : null);
  const [{ number, title, archivedAt, userStories, tasks, sheets, currentSpecVersion }, { notes }, { entries }] =
    await Promise.all([
      releaseWithSheetsHtml(release),
      api(release.url, `${release.path}/notes`),
      api(release.url, `${release.path}/interview`),
    ]);
  console.log(
    [
      ...releaseHeading({ number, title, archivedAt }),
      ...userStoriesSection(userStories),
      ...linkedTasksSection(tasks, { ofRelease: true }),
      ...linkedSheetsSection(sheets, { html: true }),
      "## Notes de la Release",
      ...(notes.length > 0 ? notes.map(noteLine) : ["Cette Release n'a pas encore de note."]),
      ...notLoadedLine(entries.length, currentSpecVersion),
    ].join("\n\n"),
  );
}

// The Release's answer, each of its Sheets with its HTML, read by the Sheet's own route once the answer names them, all
// at once, and as bytes, so that a byte order mark at its start stays, as `sheet load` prints it.
async function releaseWithSheetsHtml(release) {
  const answered = await api(release.url, release.path);
  if (answered.sheets === undefined) return answered;
  const sheets = await Promise.all(
    answered.sheets.map(async (sheet) => {
      const html = await api(release.url, sheetPath(release.project, sheet.number), { as: "bytes" });
      return { ...sheet, html: html.toString() };
    }),
  );
  return { ...answered, sheets };
}

// What the Brief leaves out, by a count and a number, nothing of their content, and no line when there is none of it.
function notLoadedLine(entryCount, currentSpecVersion) {
  const interview = entryCount > 0 ? [`Interview (${entryCount} ${entryCount === 1 ? "ajout" : "ajouts"})`] : [];
  const specVersion = currentSpecVersion === null ? [] : [`version de spec v${currentSpecVersion}`];
  const notLoaded = [...interview, ...specVersion];
  if (notLoaded.length === 0) return [];
  return [`${notLoaded.length === 1 ? "Non chargée" : "Non chargées"} : ${notLoaded.join(", ")}.`];
}

// How `load` and `brief` start a Release.
function releaseHeading({ number, title, archivedAt }) {
  return [`# R-${number} · ${title}`, ...archivedLine(archivedAt)];
}

// The User Stories of a Release, as `load` and `brief` print them.
function userStoriesSection(userStories) {
  const group =
    userStories.length === 0
      ? ["Cette Release n'a pas encore de User Story."]
      : userStories.map(({ number, sentence, notes }) =>
          [
            `US-${number} · ${sentence}`,
            // Indented whole, so that only a User Story starts a line.
            ...notes.map((note) => `  ${noteLine(note).replaceAll("\n", "\n  ")}`),
          ].join("\n"),
        );
  return ["## User Stories", ...group];
}

// The Tasks linked to the User Stories, as `load` and `brief` print them after them: each once, as `task list` prints it,
// a level lower. A Release's, `ofRelease`, say which of its User Stories link them; a User Story's alone come without.
// Left out for a Specster older than the Tasks, whose answer has none.
function linkedTasksSection(tasks, { ofRelease }) {
  if (tasks === undefined) return [];
  const blocks = tasks.map((task) => {
    const userStories = ofRelease ? task.userStories.map((userStory) => `US-${userStory}`) : undefined;
    return taskBlock(task, { level: 3, userStories });
  });
  return ["## Tâches reliées", ...(blocks.length > 0 ? blocks : ["Aucune tâche reliée."])];
}

// The Sheets linked to a Release's User Stories, as `load` and `brief` print them after its Tasks: each once, by number,
// under its number and its title, then a line with its dates, without the time, as a Task's, and those of the Release's
// User Stories that link it, and nothing of whether it is a Favorite. With `html`, as `brief` gives them, each is then
// followed by its whole HTML, which `load` leaves out. Left out for a Specster older than the Sheets, whose answer has
// none.
function linkedSheetsSection(sheets, { html }) {
  if (sheets === undefined) return [];
  const blocks = sheets.map((sheet) => {
    const { number, title, archivedAt, userStories } = sheet;
    const line = [
      ...addedAndEditedDays(sheet),
      ...(archivedAt === null ? [] : [`archivée le ${DAY_FORMAT.format(new Date(archivedAt))}`]),
      `User Stories : ${userStories.map((userStory) => `US-${userStory}`).join(", ")}`,
    ].join(" · ");
    const named = `### F-${number} · ${title}\n${line}`;
    return html ? `${named}\n\n${htmlBlock(sheet.html)}` : named;
  });
  return ["## Fiches reliées", ...(blocks.length > 0 ? blocks : ["Aucune fiche reliée."])];
}

// A Sheet's HTML, whole and as Specster keeps it, in a code block that nothing in it can close: its fences are one
// backtick longer than the longest run of them in the HTML, three at least, so that neither a heading nor a code block
// written in it passes for a part of the Brief. A line break is added only when the HTML ends without one, so that the
// closing fence has its own line.
function htmlBlock(html) {
  let longest = 0;
  for (const [run] of html.matchAll(/`+/g)) longest = Math.max(longest, run.length);
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}html\n${html.endsWith("\n") ? html : `${html}\n`}${fence}`;
}

// Null while in progress.
function archivedLine(archivedAt) {
  return archivedAt ? [`Archivée le ${DATE_FORMAT.format(new Date(archivedAt))}`] : [];
}

function labelsLine(labels) {
  return labels.length > 0 ? [`Labels : ${labels.join(", ")}`] : [];
}

// Without the line break a heredoc ends with.
function noteLine({ number, text }) {
  return `Note ${number} : ${text.replace(/\n+$/, "")}`;
}

// Where the API keeps the Release the User names, as R-n in a linked folder or by its address.
function releaseAt(reference) {
  const release = namedRelease(reference);
  if (!release) throw new UserError(`Désignez la Release par R-n ou par son adresse.\n\n${USAGE}`);
  return release;
}

function namedRelease(reference) {
  return named(reference, "R", "releases");
}

// Whether a command that takes either means a Release rather than a User Story, even written wrong, such as R-01.
function namesRelease(reference) {
  return /^R-|\/releases\//i.test(reference ?? "");
}

// Where the API keeps the User Story the User names, as US-n in a linked folder or by its address.
function userStoryAt(reference) {
  const userStory = namedUserStory(reference);
  if (!userStory) throw new UserError(`Désignez la User Story par US-n ou par son adresse.\n\n${USAGE}`);
  return userStory;
}

function namedUserStory(reference) {
  return named(reference, "US", "us");
}

// Where the API keeps what the reference names, by its address, or by its number in a linked folder, such as R-3 with the
// prefix R, and in which Project. Null when the reference is malformed.
function named(reference, prefix, collection) {
  const byAddress = new RegExp(`^(https?://[^/]+)/projets/([0-9a-f-]{36})/${collection}/([1-9][0-9]*)/?$`, "i").exec(reference ?? "");
  const byNumber = new RegExp(`^${prefix}-([1-9][0-9]*)$`, "i").exec(reference ?? "");
  if (!byAddress && !byNumber) return null;
  const { url, project } = byAddress ? { url: byAddress[1], project: byAddress[2] } : linkedProject();
  const number = byAddress ? byAddress[3] : byNumber[1];
  return { name: `${prefix}-${number}`, url, project, path: `/api/projets/${project}/${collection}/${number}` };
}

// Where the API keeps the User Story or the Release the User names, for a command that takes either.
function userStoryOrReleaseAt(reference) {
  const target = namedUserStory(reference) ?? namedRelease(reference);
  if (!target) throw new UserError(`Désignez la User Story ou la Release par US-n, R-n ou son adresse.\n\n${USAGE}`);
  return target;
}

// Where the API keeps what a Label goes on, the User Story, the Release or the Sheet the User names: a Sheet by F-n in a
// linked folder or by its address, which only the commands of Labels take.
function labelTargetAt(reference) {
  const target = namedUserStory(reference) ?? namedRelease(reference) ?? namedSheet(reference);
  if (!target) {
    throw new UserError(`Désignez la User Story, la Release ou la fiche par US-n, R-n, F-n ou son adresse.\n\n${USAGE}`);
  }
  return target;
}

// The standard input as the body of a request, plain text that the API checks is UTF-8.
async function plainTextInput() {
  return { body: await standardInput(), contentType: "text/plain; charset=utf-8" };
}

// Everything that comes on the standard input, as bytes: the API checks they are UTF-8.
async function standardInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// The Project the current folder, or the nearest one above it, was linked to with init.
function linkedProject() {
  for (let folder = process.cwd(); ; folder = path.dirname(folder)) {
    const file = path.join(folder, CONFIG_FILE);
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
    if (folder === path.dirname(folder)) {
      throw new UserError("Ce dossier n'est relié à aucun projet : lancez d'abord specster init <adresse du projet>.");
    }
  }
}

// The API's answer, read as JSON unless asked for as text or as bytes. Its errors come with a message for the User, in French,
// but for a 404 when `ifNotFound` is given, which it answers instead: a path a Specster older than the CLI doesn't serve.
async function api(url, apiPath, { method = "GET", body, contentType, as = "json", ifNotFound } = {}) {
  const token = process.env.SPECSTER_TOKEN;
  if (!token) {
    throw new UserError(
      "Donnez votre jeton personnel dans la variable SPECSTER_TOKEN : créez-le dans Specster, « Mon compte », « Jetons personnels ».",
    );
  }
  const headers = { Authorization: `Bearer ${token}`, ...(contentType && { "Content-Type": contentType }) };
  let response;
  try {
    response = await fetch(url + apiPath, { method, headers, body });
  } catch (error) {
    throw new UserError(`Specster ne répond pas à ${url} : ${error.cause?.message ?? error.message}`);
  }
  if (!response.ok) {
    if (response.status === 404 && ifNotFound !== undefined) return ifNotFound;
    const error = await response.json().catch(() => null);
    if (error?.error) throw new UserError(error.error);
    // A path Specster doesn't serve answers with a page, not with a message, and a method it doesn't serve on a path with
    // nothing: a command newer than Specster itself, such as `us list` where it served only the POST of …/us.
    if (response.status === 404 || response.status === 405) {
      throw new UserError(`Specster, à ${url}, ne connaît pas encore cette commande : il est plus ancien que la CLI.`);
    }
    throw new UserError(`Specster a répondu ${response.status}.`);
  }
  if (as === "bytes") return Buffer.from(await response.arrayBuffer());
  return as === "text" ? response.text() : response.json();
}
