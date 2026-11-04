#!/usr/bin/env node
// Specster from the command line, for a terminal or an agent: links a folder to a Project, then lists and creates its
// Releases, changes their groups and Tags, adds to their Interviews and Spec Versions, writes their Notes, archives them
// and reads them whole, writes a User Story's Notes, gives it its Labels and archives it, through Specster's API, with the
// User's Personal Token.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// The file that links a folder, and the folders below it, to a Project.
const CONFIG_FILE = ".specster.json";

const USAGE = `Usage :
  specster init <adresse du projet>   relie ce dossier au projet
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
  specster label list                 affiche les Labels des User Stories et ceux des Releases, avec leur couleur
  specster label add <US-n|R-n> <nom>…
                                      pose des Labels de sa liste sur la User Story ou la Release
  specster label remove <US-n|R-n> <nom>…
                                      retire des Labels de la User Story ou de la Release
  specster archive <US-n>             archive la User Story, si elle n'est dans aucune Release
  specster unarchive <US-n>           désarchive la User Story, si elle n'est dans aucune Release
  specster load <R-n> [vN]            affiche la Release, ses User Stories avec leurs notes, son interview et
                                      une version de spec, la version courante si vN n'est pas donnée
  specster load <US-n> [vN]           affiche la Release de la User Story, ou, sans Release, sa phrase et ses notes

Une User Story se désigne par US-n dans un dossier relié, ou par son adresse.
Une Release se désigne par R-n dans un dossier relié, ou par son adresse.
Le jeton personnel, créé dans « Mon compte », se donne dans la variable SPECSTER_TOKEN.`;

// As Specster's pages show them, such as « 29 octobre 2026 à 15:51 », in Paris time.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

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
  load,
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

// Writes the folder's link to the Project whose address the User copied from their browser.
async function init([address]) {
  const match = /^(https?:\/\/[^/]+)\/projets\/([0-9a-f-]{36})(?:\/|$)/i.exec(address ?? "");
  if (!match) throw new UserError(`Donnez l'adresse du projet, copiée dans le navigateur.\n\n${USAGE}`);
  const [, url, project] = match;
  writeFileSync(CONFIG_FILE, `${JSON.stringify({ url, project }, null, 2)}\n`);
  console.log(`Ce dossier est relié au projet ${project} de ${url}.`);
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
  const path = `/api/projets/${project}/releases`;
  const created = await api(url, path, { method: "POST", body: JSON.stringify({ title }), contentType: "application/json" });
  console.log(`R-${created.number} créée : « ${created.title} ».`);
  if (numbers.length > 0) {
    await changeGroup({ name: `R-${created.number}`, url, path: `${path}/${created.number}` }, "add", numbers);
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

// Sends the change, and says what it did to each User Story, in the order the User named them.
async function changeGroup(release, change, numbers) {
  const { userStories } = await api(release.url, `${release.path}/user-stories`, {
    method: "PATCH",
    body: JSON.stringify({ [change]: numbers }),
    contentType: "application/json",
  });
  const said =
    change === "add"
      ? (name, changed) => (changed ? `${name} ajoutée à ${release.name}.` : `${name} était déjà dans ${release.name}.`)
      : (name, changed) => (changed ? `${name} retirée de ${release.name}.` : `${name} n'était pas dans ${release.name}.`);
  console.log(userStories.map(({ number, changed }) => said(`US-${number}`, changed)).join("\n"));
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

// The linked Project's two lists of Labels, apart, each in alphabetical order, with their colors.
async function listLabels() {
  const { url, project } = linkedProject();
  const [ofUserStories, ofReleases] = await Promise.all([
    api(url, `/api/projets/${project}/labels`),
    api(url, `/api/projets/${project}/releases/labels`),
  ]);
  const lines = (labels) =>
    labels.length > 0 ? labels.map(({ name, color }) => `${name} · ${COLOR_NAMES.get(color) ?? color}`) : ["Aucun Label."];
  console.log(
    [
      "Labels des User Stories :",
      ...lines(ofUserStories.labels),
      "Labels des Releases :",
      ...lines(ofReleases.labels),
    ].join("\n"),
  );
}

// Gives the User Story or the Release the Labels of its list the User names. Asking again changes nothing.
async function addLabels(args) {
  await changeLabels("add", args, (targetName, name, changed) =>
    changed ? `Label « ${name} » ajouté à ${targetName}.` : `${targetName} avait déjà le Label « ${name} ».`,
  );
}

// Takes the named Labels off the User Story or the Release. Asking again changes nothing.
async function removeLabels(args) {
  await changeLabels("remove", args, (targetName, name, changed) =>
    changed ? `Label « ${name} » retiré de ${targetName}.` : `${targetName} n'avait pas le Label « ${name} ».`,
  );
}

// One request for all the names, so that an unknown one changes nothing for the others. One line for each Label.
async function changeLabels(change, [reference, ...names], lineFor) {
  const target = userStoryOrReleaseAt(reference);
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

// What an agent reads before working on the Release or the User Story. A User Story in a Release leads to it, as it holds
// its Interview and its Spec Versions. Nothing is printed unless all of it can be.
async function load([reference, version]) {
  const target = namesRelease(reference) ? releaseAt(reference) : userStoryAt(reference);
  const asked = version === undefined ? null : /^v?([1-9][0-9]*)$/i.exec(version)?.[1];
  if (asked === undefined) throw new UserError(`Désignez la version de spec par vN, comme v2.\n\n${USAGE}`);
  const shown = asked === null ? null : Number(asked);
  console.log(namesRelease(reference) ? await loadedRelease(target, shown) : await loadedUserStory(target, shown));
}

// The Release as `load` prints it, with the Spec Version asked for, or the Current Spec Version. The Notes it shows are
// those of its User Stories: its own are for note list.
async function loadedRelease(release, asked) {
  const { number, title, tag, archivedAt, labels, userStories, currentSpecVersion, specVersions } = await api(
    release.url,
    release.path,
  );
  const shown = asked ?? currentSpecVersion;
  if (shown !== null && !specVersions.some((specVersion) => specVersion.number === shown)) {
    throw new UserError(`${release.name} n'a pas de v${shown}.`);
  }
  const { entries } = await api(release.url, `${release.path}/interview`);
  const group =
    userStories.length === 0
      ? ["Cette Release n'a pas encore de User Story."]
      : userStories.map(({ number: userStory, sentence, notes }) =>
          [
            `US-${userStory} · ${sentence}`,
            // Indented whole, so that only a User Story starts a line.
            ...notes.map((note) => `  ${noteLine(note).replaceAll("\n", "\n  ")}`),
          ].join("\n"),
        );
  const interview =
    entries.length === 0
      ? ["Cette Release n'a pas encore d'interview."]
      : entries.map(({ text, createdAt }) => `### Ajout du ${DATE_FORMAT.format(new Date(createdAt))}\n\n${text}`);
  const specVersion =
    shown === null
      ? ["## Version de spec", "Cette Release n'a pas encore de version de spec."]
      : [
          `## Version de spec v${shown}${shown === currentSpecVersion ? " (Version courante)" : ""}`,
          await api(release.url, `${release.path}/v/${shown}`, { as: "text" }),
        ];
  return [
    `# R-${number} · ${title}`,
    ...archivedLine(archivedAt),
    `Tag : ${tag ?? "aucun"}`,
    ...labelsLine(labels),
    "## User Stories",
    ...group,
    "## Interview",
    ...interview,
    ...specVersion,
  ].join("\n\n");
}

// The Release of the User Story as `load` prints it, or, without one, all that the User Story has: no Spec Version.
async function loadedUserStory(userStory, asked) {
  const { number, sentence, archivedAt, labels, release } = await api(userStory.url, userStory.path);
  if (release !== null) {
    const path = userStory.path.replace(/\/us\/[0-9]+$/, `/releases/${release}`);
    const loaded = await loadedRelease({ name: `R-${release}`, url: userStory.url, path }, asked);
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
  ].join("\n\n");
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

// Null when the reference is malformed.
function namedRelease(reference) {
  const byAddress = /^(https?:\/\/[^/]+)\/projets\/([0-9a-f-]{36})\/releases\/([1-9][0-9]*)\/?$/i.exec(reference ?? "");
  if (byAddress) {
    const [, url, project, number] = byAddress;
    return { name: `R-${number}`, url, path: `/api/projets/${project}/releases/${number}` };
  }
  const byNumber = /^R-([1-9][0-9]*)$/i.exec(reference ?? "");
  if (!byNumber) return null;
  const { url, project } = linkedProject();
  return { name: `R-${byNumber[1]}`, url, path: `/api/projets/${project}/releases/${byNumber[1]}` };
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

// Null when the reference is malformed.
function namedUserStory(reference) {
  const byAddress = /^(https?:\/\/[^/]+)\/projets\/([0-9a-f-]{36})\/us\/([1-9][0-9]*)\/?$/i.exec(reference ?? "");
  if (byAddress) {
    const [, url, project, number] = byAddress;
    return { name: `US-${number}`, url, path: `/api/projets/${project}/us/${number}` };
  }
  const byNumber = /^US-([1-9][0-9]*)$/i.exec(reference ?? "");
  if (!byNumber) return null;
  const { url, project } = linkedProject();
  return { name: `US-${byNumber[1]}`, url, path: `/api/projets/${project}/us/${byNumber[1]}` };
}

// Where the API keeps the User Story or the Release the User names, for a command that takes either.
function userStoryOrReleaseAt(reference) {
  const target = namedUserStory(reference) ?? namedRelease(reference);
  if (!target) throw new UserError(`Désignez la User Story ou la Release par US-n, R-n ou son adresse.\n\n${USAGE}`);
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

// The API's answer, read as JSON unless asked for as text. Its errors come with a message for the User, in French.
async function api(url, apiPath, { method = "GET", body, contentType, as = "json" } = {}) {
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
    const error = await response.json().catch(() => null);
    if (error?.error) throw new UserError(error.error);
    // A path Specster doesn't serve answers with a page, not with a message: a command newer than Specster itself.
    if (response.status === 404) {
      throw new UserError(`Specster, à ${url}, ne connaît pas encore cette commande : il est plus ancien que la CLI.`);
    }
    throw new UserError(`Specster a répondu ${response.status}.`);
  }
  return as === "text" ? response.text() : response.json();
}
