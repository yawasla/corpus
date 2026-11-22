// Bulugh al-Maram OpenITI : découpage en hadiths (« ### | N - ») et rapprochement par le texte avec hadith-json (numérotations différentes).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCES = join(dirname(fileURLToPath(import.meta.url)), "../sources/hadith");

// Normalisation pour comparer : sans voyelles ni ponctuation, variantes d'alif/ya/ta marbuta unifiées.
const norm = (s) =>
  s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^ء-ي]/g, "");

let index;
function charge() {
  if (index) return index;
  const corps = readFileSync(join(SOURCES, "openiti-bulugh-almaram.txt"), "utf8").split("#META#Header#End#").pop();
  const entrees = [];
  let courant = null;
  for (const ligne of corps.split("\n")) {
    const titre = ligne.match(/^### \| (.*)$/);
    if (titre) {
      const c = titre[1].trim();
      if (/^\d+ -/.test(c)) courant = entrees.push("") - 1;
      else if (!/^\[ص: \d+\]$/.test(c)) courant = null; // titre de chapitre : fin du hadith ; repère de page : suite
      continue;
    }
    if (courant !== null) entrees[courant] += " " + ligne;
  }
  // Balises de mise en page retirées, le texte lui-même n'est pas touché.
  const textes = entrees.map((e) => e.replace(/(^|\s)# /g, " ").replace(/~~/g, "").replace(/PageV\d+P\d+|ms\d+|\(\d+\)/g, "").replace(/\s+/g, " ").trim());
  const debuts = [];
  let gros = "";
  for (const t of textes) {
    debuts.push(gros.length);
    gros += norm(t) + "|";
  }
  index = { textes, debuts, gros };
  return index;
}

// Numéro (1-based) de l'entrée OpenITI contenant ce texte arabe, ou null.
export function trouveBulugh(arabe) {
  const { debuts, gros } = charge();
  const n = norm(arabe);
  for (const [a, b] of [[25, 65], [10, 50], [45, 85], [0, 30]]) {
    const extrait = n.slice(a, b);
    if (extrait.length < 20) continue;
    const i = gros.indexOf(extrait);
    if (i === -1) continue;
    let k = debuts.length - 1;
    while (debuts[k] > i) k--;
    return k + 1;
  }
  return null;
}

export function texteBulugh(numero) {
  return charge().textes[numero - 1];
}
