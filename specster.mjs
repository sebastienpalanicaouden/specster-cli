#!/usr/bin/env node
// Specster from the command line, for a terminal or an agent: links a folder to a Project, then reads and adds to a
// User Story's Interview and Spec Versions through Specster's API, with the User's Personal Token.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// The file that links a folder, and the folders below it, to a Project.
const CONFIG_FILE = ".specster.json";

const USAGE = `Usage :
  specster init <adresse du projet>   relie ce dossier au projet
  specster interview add <US-n>       ajoute l'entrée standard à l'interview de la User Story
  specster spec-version add <US-n>    ajoute l'entrée standard, du HTML, comme version de spec
  specster load <US-n> [vN]           affiche la User Story, son interview et une version de spec,
                                      la version courante si vN n'est pas donnée

Une User Story se désigne par US-n dans un dossier relié, ou par son adresse.
Le jeton personnel, créé dans « Mon compte », se donne dans la variable SPECSTER_TOKEN.`;

// As Specster's pages show them, such as « 29 octobre 2026 à 15:51 », in Paris time.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

// A message for the User, printed as it is, without a stack trace.
class UserError extends Error {}

const COMMANDS = { init, "interview add": addInterviewEntry, "spec-version add": addSpecVersion, load };

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

// Adds what comes on the standard input, word for word, as the next Entry of the User Story's Interview.
async function addInterviewEntry([reference]) {
  const userStory = userStoryAt(reference);
  await api(userStory.url, `${userStory.path}/interview`, {
    method: "POST",
    body: await standardInput(),
    contentType: "text/plain; charset=utf-8",
  });
  console.log(`Ajout enregistré dans l'interview de ${userStory.name}.`);
}

// Adds what comes on the standard input, HTML kept byte for byte, as the User Story's next Spec Version.
async function addSpecVersion([reference]) {
  const userStory = userStoryAt(reference);
  const { number } = await api(userStory.url, `${userStory.path}/v`, {
    method: "POST",
    body: await standardInput(),
    contentType: "text/html; charset=utf-8",
  });
  console.log(`${userStory.name} v${number} ajoutée : c'est la Version courante.`);
}

// The User Story, its Interview and one of its Spec Versions, the Current Spec Version unless told otherwise.
async function load([reference, version]) {
  const userStory = userStoryAt(reference);
  const asked = version === undefined ? null : /^v?([1-9][0-9]*)$/i.exec(version)?.[1];
  if (asked === undefined) throw new UserError(`Désignez la version de spec par vN, comme v2.\n\n${USAGE}`);
  const { number, sentence, currentSpecVersion } = await api(userStory.url, userStory.path);
  const { entries } = await api(userStory.url, `${userStory.path}/interview`);
  const interview =
    entries.length === 0
      ? ["Cette User Story n'a pas encore d'interview."]
      : entries.map(({ text, createdAt }) => `### Ajout du ${DATE_FORMAT.format(new Date(createdAt))}\n\n${text}`);
  const shown = asked === null ? currentSpecVersion : Number(asked);
  const specVersion =
    shown === null
      ? ["## Version de spec", "Cette User Story n'a pas encore de version de spec."]
      : [
          `## Version de spec v${shown}${shown === currentSpecVersion ? " (Version courante)" : ""}`,
          await api(userStory.url, `${userStory.path}/v/${shown}`, { as: "text" }),
        ];
  console.log([`# US-${number} · ${sentence}`, "## Interview", ...interview, ...specVersion].join("\n\n"));
}

// Where the API keeps the User Story the User names, as US-n in a linked folder or by its address.
function userStoryAt(reference) {
  const byAddress = /^(https?:\/\/[^/]+)\/projets\/([0-9a-f-]{36})\/us\/([1-9][0-9]*)\/?$/i.exec(reference ?? "");
  if (byAddress) {
    const [, url, project, number] = byAddress;
    return { name: `US-${number}`, url, path: `/api/projets/${project}/us/${number}` };
  }
  const byNumber = /^US-([1-9][0-9]*)$/i.exec(reference ?? "");
  if (!byNumber) throw new UserError(`Désignez la User Story par US-n ou par son adresse.\n\n${USAGE}`);
  const { url, project } = linkedProject();
  return { name: `US-${byNumber[1]}`, url, path: `/api/projets/${project}/us/${byNumber[1]}` };
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
    throw new UserError(error?.error ?? `Specster a répondu ${response.status}.`);
  }
  return as === "text" ? response.text() : response.json();
}
