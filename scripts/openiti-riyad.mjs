// Riyad as-Salihin OpenITI : découpage en hadiths (« ### ||| k/N- », N = numéro dans le recueil) et rapprochement par le texte avec hadith-json (numérotations différentes).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { norm } from "./openiti-bulugh.mjs";

const SOURCES = join(dirname(fileURLToPath(import.meta.url)), "../sources/hadith");

let index;
function charge() {
  if (index) return index;
  const src = readFileSync(join(SOURCES, "openiti-riyad-assalihin.mARkdown"), "utf8");
  const blocs = [...src.matchAll(/^### \|\|\| \d+\/\s*(\d+)\s*-[^\n]*\n([\s\S]*?)(?=^#{2,3} )/gm)];
  // Numéros OpenITI parfois fautifs (« 453 » pour 1453, « 0 », « 989 » pour 289) : réparés d'après les voisins.
  const numeros = [];
  blocs.forEach(([, brut], i) => {
    const n = Number(brut);
    const attendu = (numeros[i - 1] ?? 0) + 1;
    const suivant = Number(blocs[i + 1]?.[1]);
    const coupe = n > 0 && attendu % 10 ** String(n).length === n; // chiffres de tête perdus
    numeros.push(n === attendu || (n !== attendu && (coupe || n === 0 || suivant === attendu + 1)) ? attendu : n);
  });
  // Balises de mise en page retirées, le texte lui-même n'est pas touché.
  const textes = blocs.map(([, , t]) => t.replace(/^# /gm, "").replace(/~~/g, "").replace(/PageV\d+P\d+|ms\d+/g, "").replace(/\s+/g, " ").trim());
  const debuts = [];
  let gros = "";
  for (const t of textes) {
    debuts.push(gros.length);
    gros += norm(t) + "|";
  }
  index = { numeros, textes, debuts, gros, parNumero: new Map(numeros.map((n, i) => [n, i])) };
  return index;
}

// Numéro (réparé) du hadith OpenITI contenant ce texte arabe, ou null.
export function trouveRiyad(arabe) {
  const { numeros, debuts, gros } = charge();
  const n = norm(arabe);
  for (const [a, b] of [[25, 65], [10, 50], [45, 85], [0, 30]]) {
    const extrait = n.slice(a, b);
    if (extrait.length < 20) continue;
    const i = gros.indexOf(extrait);
    if (i === -1) continue;
    let k = debuts.length - 1;
    while (debuts[k] > i) k--;
    return numeros[k];
  }
  return null;
}

export function texteRiyad(numero) {
  const { textes, parNumero } = charge();
  return parNumero.has(numero) ? textes[parNumero.get(numero)] : undefined;
}

// Contrôle : numéros encore hors séquence après réparation.
export function anomaliesRiyad() {
  const { numeros } = charge();
  return numeros.flatMap((n, i) => (i && n !== numeros[i - 1] + 1 ? [`${numeros[i - 1]} → ${n}`] : []));
}
