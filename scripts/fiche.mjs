// Préremplit src/data/compagnons/compagnon_NNN.ts depuis la synthèse Mistral (analyse/mistral/NNN-slug-synthese.json).
// Usage : npm run fiche -- <id>   → texte arabe copié verbatim depuis sources/hadith ; résumé Wikipédia et traductions conservés s'ils existent déjà.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { trouveBulugh, texteBulugh } from "./openiti-bulugh.mjs";
import { trouveRiyad, texteRiyad } from "./openiti-riyad.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = join(RACINE, "sources/hadith");
const id = Number(process.argv[2]);
if (!id) throw new Error("Usage : npm run fiche -- <id>");
const pad = String(id).padStart(3, "0");
const synthese = readdirSync(join(RACINE, "analyse/mistral")).find((f) => f.startsWith(`${pad}-`) && f.endsWith("-synthese.json"));
if (!synthese) throw new Error(`Synthèse absente : npm run filtre -- synthese ${id}`);
const traits = JSON.parse(readFileSync(join(RACINE, "analyse/mistral", synthese), "utf8"));

const hadithApi = {};
let bulughJson;
let riyadJson;
function depuisHadithApi(fichier, numero) {
  hadithApi[fichier] ??= new Map(JSON.parse(readFileSync(join(SOURCES, fichier), "utf8")).hadiths.map((h) => [h.hadithnumber, h]));
  return hadithApi[fichier].get(numero);
}

// Pas de très longs hadiths sur la page (CLAUDE.md) : au-delà, le trait est retiré.
const MAX_CARACTERES = 2000;
const cacheFiltre = JSON.parse(readFileSync(join(RACINE, "analyse/mistral", synthese.replace("-synthese", "")), "utf8"));

function hadithDe(refHadith) {
  const ref = cacheFiltre[refHadith]?.arabe ?? "";
  const numero = Number(ref.match(/\d+$/)?.[0]);
  const recueil = refHadith.replace(/ \d+$/, "");
  let hadith = null;
  if (ref.startsWith("hadith-api") && recueil === "Sahih al-Bukhari") {
    const h = depuisHadithApi("ara-bukhari.json", numero);
    hadith = h && { recueil, numero, arabe: h.text, degre: "Sahih" };
  } else if (ref.startsWith("hadith-api") && recueil === "Al-Muwatta") {
    const h = depuisHadithApi("ara-malik.json", numero);
    hadith = h && { recueil, numero, arabe: h.text, degre: h.grades[0]?.grade ?? "" };
  } else if (recueil === "Bulugh al-Maram") {
    // Rapprochement refait ici : le cache du filtre peut dater d'avant le lien OpenITI.
    bulughJson ??= new Map(JSON.parse(readFileSync(join(SOURCES, "bulugh_almaram.json"), "utf8")).hadiths.map((h) => [h.idInBook, h.arabic]));
    const n = trouveBulugh(bulughJson.get(Number(refHadith.match(/\d+$/)[0])) ?? "");
    hadith = n && { recueil, numero: Number(refHadith.match(/\d+$/)[0]), arabe: texteBulugh(n), degre: "" };
  } else if (recueil === "Riyad as-Salihin") {
    // Rapprochement par le texte refait ici (le cache du filtre peut porter l'ancien numéro) ; numéro affiché = celui d'OpenITI.
    riyadJson ??= new Map(JSON.parse(readFileSync(join(SOURCES, "riyad_assalihin.json"), "utf8")).hadiths.map((h) => [h.idInBook, h.arabic]));
    const n = trouveRiyad(riyadJson.get(Number(refHadith.match(/\d+$/)[0])) ?? "");
    hadith = n && { recueil, numero: n, arabe: texteRiyad(n), degre: "" };
  }
  return hadith;
}

// Traits gardés sur la page, dans l'ordre d'importance de la synthèse.
const MAX_TRAITS = id <= 4 ? 30 : 20; // cible 25–30 (ids 1–4) ou 15–20 selon la matière disponible
// Répartition homogène des recueils (CLAUDE.md) : quotas sur le nombre de traits, relâchés seulement s'il manque des traits.
const QUOTAS = { "Sahih al-Bukhari": 0.3, "Al-Muwatta": 0.25, "Riyad as-Salihin": 0.25, "Bulugh al-Maram": 0.2 };
const quota = (recueil) => Math.round((QUOTAS[recueil] ?? 0) * MAX_TRAITS);
const JURIDIQUE = /\b(rul(ed|ing|e)|judg(ed|ement|ment)|inheritance|custody|compensation|punish\w*)\b/i;
// Exclusions de relecture conservées dans la fiche existante.
const fichierFiche = join(RACINE, `src/data/compagnons/compagnon_${pad}.ts`);
const exclusFiche = existsSync(fichierFiche) ? (JSON.parse(readFileSync(fichierFiche, "utf8").match(/= (\{[\s\S]*\});\s*$/)[1]).exclus ?? []) : [];
const exclus = new Set(exclusFiche.map((e) => e.ref));
const fiches = [];
const episodes = new Set();
const parRecueil = {};
const ecartes = [];

function choisir(t, respecterQuotas) {
  // Seulement le hadith principal : un doublon peut raconter un autre fait de la même période (ex. le baiser au lieu du discours).
  const candidats = [t.main]
    .map(hadithDe)
    .filter((h) => h && !exclus.has(`${h.recueil} ${h.numero}`) && h.arabe.length <= MAX_CARACTERES && (!respecterQuotas || (parRecueil[h.recueil] ?? 0) < quota(h.recueil)));
  return (
    candidats.find((h) => `${h.recueil} ${h.numero}` === t.main) ??
    candidats.sort((a, b) => (parRecueil[a.recueil] ?? 0) - (parRecueil[b.recueil] ?? 0) || a.arabe.length - b.arabe.length)[0]
  );
}

function ajouter(t, hadith) {
  episodes.add((t.episode ?? "").toLowerCase());
  parRecueil[hadith.recueil] = (parRecueil[hadith.recueil] ?? 0) + 1;
  fiches.push({ trait: { en: t.trait.replace(/\bProphet\b(?! ﷺ)/g, "Prophet ﷺ") }, hadith });
}

for (const t of traits) {
  if (fiches.length >= MAX_TRAITS) break;
  // Décision juridique (garde, héritage, règle de zakat...) : jamais un trait, même si la synthèse la laisse passer.
  if (JURIDIQUE.test(t.trait)) continue;
  const hadith = choisir(t, true);
  if (hadith) ajouter(t, hadith);
  else ecartes.push(t);
}
for (const t of ecartes) {
  if (fiches.length >= MAX_TRAITS) break;
  if (JURIDIQUE.test(t.trait)) continue;
  const hadith = choisir(t, false);
  if (hadith) ajouter(t, hadith);
  else console.warn(`⚠️ ${t.main} : aucun hadith court (≤ ${MAX_CARACTERES} car.) avec texte arabe, trait ignoré : ${t.trait}`);
}
console.log(`répartition : ${JSON.stringify(parRecueil)}`);

const fichier = join(RACINE, `src/data/compagnons/compagnon_${pad}.ts`);
const vide = { fr: "", en: "", es: "", ar: "" };
let ancien = { wikipedia: vide, resume: vide, traits: [] };
if (existsSync(fichier)) ancien = JSON.parse(readFileSync(fichier, "utf8").match(/= (\{[\s\S]*\});\s*$/)[1]);
// Entrées validées (valide: true) : reprises telles quelles, en tête, jamais remplacées.
const valides = ancien.traits.filter((t) => t.valide);
const refsValides = new Set(valides.map((t) => `${t.hadith.recueil} ${t.hadith.numero}`));
const traductions = new Map(ancien.traits.map((t) => [t.trait.cle ?? t.trait.en, t.trait]));
const traductionsHadiths = new Map(ancien.traits.map((t) => [`${t.hadith.recueil} ${t.hadith.numero}`, t.hadith.traduction]));
const fiche = {
  wikipedia: ancien.wikipedia,
  exclus: exclusFiche,
  resume: ancien.resume,
  // Trait déjà traduit (même trait de synthèse) : on garde la version relue, sinon trait anglais brut avec sa clé.
  traits: [
    ...valides,
    ...fiches
      .filter((f) => !refsValides.has(`${f.hadith.recueil} ${f.hadith.numero}`))
      .slice(0, Math.max(0, MAX_TRAITS - valides.length))
      .map((f) => ({
        hadith: { ...f.hadith, traduction: traductionsHadiths.get(`${f.hadith.recueil} ${f.hadith.numero}`) },
        trait: traductions.get(f.trait.en) ?? { cle: f.trait.en, ...f.trait },
      })),
  ],
};
writeFileSync(
  fichier,
  `import type { FicheCompagnon } from "@/conf/types";\n\n// Généré par scripts/fiche.mjs puis relu à la main (résumé Wikipédia, traits, traductions).\nexport const fiche: FicheCompagnon = ${JSON.stringify(fiche, null, 2)};\n`
);
console.log(`${fichier.replace(RACINE + "/", "")} : ${fiches.length} traits`);
