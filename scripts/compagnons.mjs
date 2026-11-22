// Repère, pour chaque Compagnon de src/data/config.ts, les hadiths candidats dans les quatre recueils (outil interne, ne décide rien).
// Usage : npm run compagnons → écrit analyse/compagnons/ (resume.md + un fichier par Compagnon).
// Repérage sur les fichiers anglais hadith-json (rapporteur séparé du texte), texte arabe affichable retrouvé dans hadith-api / OpenITI.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { trouveBulugh } from "./openiti-bulugh.mjs";
import { trouveRiyad } from "./openiti-riyad.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = join(RACINE, "sources/hadith");
const SORTIE = join(RACINE, "analyse/compagnons");

// Livres consacrés aux Compagnons (numérotation sunnah.com) : un hadith qui s'y trouve est fort même si le Compagnon n'en est que le rapporteur.
const RECUEILS = [
  { cle: "bukhari", nom: "Sahih al-Bukhari", livresCompagnons: [62, 63], livresRecit: [61, 64] },
  { cle: "malik", nom: "Al-Muwatta", livresCompagnons: [], livresRecit: [] },
  { cle: "riyad_assalihin", nom: "Riyad as-Salihin", livresCompagnons: [8], livresRecit: [] },
  { cle: "bulugh_almaram", nom: "Bulugh al-Maram", livresCompagnons: [], livresRecit: [] },
];

// Variantes anglaises (style sunnah.com) par id ; un nom seul suivi de « bin X » ne compte que si X correspond à une variante complète.
// Retirés de la liste (src/data/config.ts) : variantes élargies sans résultat ou mention indirecte seulement, moins de 3 faits sur eux.
const RETIRES = [
  ["Sumayya bint Khayyat", "aucune mention (variantes Sumaiya, Sumayya, Umm 'Ammar)"],
  ["Al-Arqam ibn Abi al-Arqam", "aucune mention (les « Arqam » trouvés sont Zayd ibn Arqam)"],
  ["Ikrima ibn Abi Jahl", "une mention indirecte (Al-Muwatta 1197, son épouse)"],
  ["Ruqayya bint Muhammad", "aucune mention nommée (la Ruqayya d'Al-Muwatta 907 est une affranchie)"],
  ["Zaynab bint Muhammad", "une mention indirecte (Bukhari 3568, son époux Abu al-'As)"],
  ["Umm Kulthum bint Muhammad", "aucune mention (les Umm Kulthum trouvées sont d'autres personnes)"],
  ["Al-Husayn ibn Ali", "0 épisode retenu au tri Mistral"],
  ["Uqba ibn Amir", "0 épisode retenu au tri Mistral"],
  ["Wa'il ibn Hujr", "0 épisode retenu au tri Mistral"],
  ["Samura ibn Jundab", "0 épisode retenu au tri Mistral"],
  ["Mus'ab ibn Umayr", "1 épisode retenu au tri Mistral"],
  ["Juwayriya bint al-Harith", "1 épisode retenu au tri Mistral"],
  ["Imran ibn Husayn", "1 épisode retenu au tri Mistral"],
  ["An-Nu'man ibn Bashir", "1 épisode retenu au tri Mistral"],
  ["Abu Umama al-Bahili", "1 épisode retenu au tri Mistral"],
  ["Tamim ad-Dari", "1 épisode retenu au tri Mistral"],
  ["Abu Juhayfa", "1 épisode retenu au tri Mistral"],
  ["Asma bint Umays", "1 épisode retenu au tri Mistral"],
  ["Sa'id ibn Zayd", "2 épisodes retenus au tri Mistral"],
  ["Salim mawla Abi Hudhayfa", "2 épisodes retenus au tri Mistral"],
  ["Abu Hudhayfa ibn Utba", "2 épisodes retenus au tri Mistral"],
  ["Zayd ibn Arqam", "2 épisodes retenus au tri Mistral"],
  ["Abd Allah ibn Mughaffal", "2 épisodes retenus au tri Mistral"],
  ["Zayd ibn al-Khattab", "0 épisode retenu au tri Mistral"],
  ["Buraydah ibn al-Husayb", "1 épisode retenu au tri Mistral"],
  ["As-Sa'ib ibn Yazid", "2 épisodes retenus au tri Mistral"],
  ["Umm Hani bint Abi Talib", "2 épisodes retenus au tri Mistral"],
  ["Zayd ibn Khalid al-Juhani", "2 épisodes retenus au tri Mistral"],
  ["Adi ibn Hatim", "2 épisodes retenus au tri Mistral"],
];

const VARIANTES = {
  1: ["Abu Bakr", "Abu Bakr As-Siddiq", "As-Siddiq"],
  2: ["Umar", "Umar bin Al-Khattab"],
  3: ["Uthman", "Uthman bin Affan"],
  4: ["Ali", "Ali bin Abi Talib"],
  5: ["Talha", "Talha bin Ubaidullah"],
  6: ["Az-Zubair", "Zubair", "Az-Zubair bin Al-Awwam"],
  7: ["Abdur-Rahman bin Auf", "Abdul Rahman bin Auf", "Ibn Auf"],
  8: ["Sa`d bin Abi Waqqas", "Sa`d bin Malik"],
  9: ["Abu Ubaida", "Abu Ubaida bin Al-Jarrah"],
  10: ["Khadija", "Khadija bint Khuwailid"],
  11: ["Aisha", "Aisha bint Abi Bakr"],
  12: ["Fatima", "Fatima bint Muhammad"],
  13: ["Hafsa", "Hafsa bint Umar"],
  14: ["Umm Salama"],
  15: ["Hamza", "Hamza bin Abdul Muttalib"],
  16: ["Al-Abbas", "Abbas", "Al-Abbas bin Abdul Muttalib"],
  17: ["Al-Hasan bin Ali", "Hasan bin Ali"],
  18: ["Ibn Abbas", "Abdullah bin Abbas"],
  19: ["Ibn Umar", "Abdullah bin Umar"],
  20: ["Ibn Mas`ud", "Abdullah bin Mas`ud"],
  21: ["Abu Huraira"],
  22: ["Anas", "Anas bin Malik"],
  23: ["Jabir", "Jabir bin Abdullah"],
  24: ["Abu Sa`id Al-Khudri", "Abu Sa`id"],
  25: ["Abdullah bin Amr", "Abdullah bin Amr bin Al-As"],
  26: ["Mu`adh", "Mu`adh bin Jabal"],
  27: ["Ubai bin Ka`b", "Ubaiy bin Ka`b", "Ubayy bin Ka`b"],
  28: ["Zaid bin Thabit"],
  29: ["Abu Musa", "Abu Musa Al-Ash`ari"],
  30: ["Abu Dharr"],
  31: ["Salman", "Salman Al-Farisi"],
  32: ["Bilal", "Bilal bin Rabah"],
  33: ["Ammar", "Ammar bin Yasir"],
  34: ["Abu Ad-Darda", "Abu Darda", "Abu Al-Darda"],
  35: ["Khalid bin Al-Walid", "Khalid bin Walid"],
  36: ["Amr bin Al-As", "Amr bin Al-Aas"],
  37: ["Mu`awiya", "Mu`awiya bin Abi Sufyan"],
  38: ["Sa`d bin Mu`adh"],
  39: ["Sa`d bin Ubada"],
  40: ["Usama", "Usama bin Zaid"],
  41: ["Zaid bin Haritha"],
  42: ["Ja`far", "Ja`far bin Abi Talib"],
  43: ["Abdullah bin Rawaha", "Ibn Rawaha"],
  44: ["Hudhaifa", "Hudhaifa bin Al-Yaman"],
  45: ["Abu Ayyub", "Abu Aiyub", "Abu Ayyub Al-Ansari"],
  46: ["Al-Bara", "Al-Bara bin Azib", "Bara bin Azib"],
  47: ["Abu Talha"],
  48: ["Umm Sulaim"],
  49: ["Asma", "Asma bint Abi Bakr"],
  50: ["Sauda", "Sawda", "Sauda bint Zam`a"],
  51: ["Zainab bint Jahsh"],
  52: ["Maimuna", "Maimuna bint Al-Harith"],
  53: ["Umm Habiba"],
  54: ["Safiya", "Safiyya", "Safiya bint Huyai"],
  55: ["Abdullah bin Az-Zubair", "Ibn Az-Zubair", "Ibn Zubair"],
  56: ["Abu Qatada"],
  57: ["Sahl", "Sahl bin Sa`d"],
  58: ["Ubada", "Ubada bin As-Samit"],
  59: ["Abu Bakra"],
  60: ["Jarir", "Jarir bin Abdullah"],
  61: ["Al-Mughira", "Al-Mughira bin Shu`ba", "Mughira bin Shu`ba"],
  62: ["Abu Mas`ud", "Abu Mas`ud Al-Ansari"],
  63: ["Suhaib"],
  64: ["Khabbab", "Khabbab bin Al-Aratt"],
  65: ["Al-Miqdad", "Miqdad"],
  66: ["Itban", "Itban bin Malik", "Utban bin Malik"],
  67: ["Ka`b bin Malik"],
  68: ["Hassan bin Thabit"],
  69: ["Abdullah bin Salam"],
  70: ["Abu Sufyan", "Abu Sufyan bin Harb"],
  71: ["Uthman bin Maz`un", "Uthman bin Madh`un"],
  72: ["Anas bin An-Nadr", "Anas bin Nadr"],
  73: ["Umm Aiman", "Umm Ayman"],
  74: ["Umm Atiya", "Umm Atiyya"],
  75: ["Al-Fadl", "Al-Fadl bin Abbas"],
  76: ["Thabit bin Qais"],
  77: ["Rafi` bin Khadij"],
  // Ajouts (repérage des absents) : à confirmer par le tri Mistral.
  78: ["Barira"],
  79: ["Al-Miswar bin Makhrama", "Al-Miswar"],
  80: ["Ibn Um Maktum", "Ibn Umm Maktum"],
  81: ["Ibn Abi Aufa", "`Abdullah bin Abi Aufa"],
  82: ["Hakim bin Hizam"],
  83: ["Abu Usaid"],
  84: ["Jubair bin Mut`im"],
  85: ["Usaid bin Hudair", "Usaid bin Al-Hudair"],
  86: ["Ka`b bin `Ujra"],
  87: ["Abu Lubaba"],
  88: ["Abu Barza"],
  89: ["Hind bint `Utba"],
  90: ["Um Haram", "Umm Haram"],
  91: ["Abu Jandal"],
  92: ["Sa`d bin Ar-Rabi`"],
  93: ["Hilal bin Umaiya"],
  94: ["Anjasha"],
  95: ["Thumama bin Uthal", "Thumama"],
  96: ["Salama bin Al-Akwa`", "Ibn Al-Akwa`"],
};

// Même normalisation pour les variantes et les textes : Huraira/Hurairah, `Aisha/'Aishah, Ibn/bin, Zayd/Zaid, lettres doublées...
function norm(s) {
  return (
    " " +
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[`'’‘ʿʾ]/g, "")
      .replace(/[^a-z]+/g, " ")
      .replace(/([a-z])\1+/g, "$1")
      .replace(/ay/g, "ai")
      .replace(/ah\b/g, "a")
      .replace(/\bibn\b/g, "bin")
      .replace(/\babi\b/g, "abu")
      .replace(/\s+/g, " ")
      .trim() +
    " "
  );
}

const PRECEDENTS_EXCLUS = [" bin ", " bint ", " abu ", " um "];

// Positions où le Compagnon est nommé dans un texte normalisé (les homonymes « X bin Y » et « fils/père de X » sont écartés).
function trouve(texte, variantes) {
  const completes = variantes.filter((v) => / bin | bint /.test(v));
  for (const v of variantes) {
    let i = texte.indexOf(v);
    while (i !== -1) {
      const avant = texte.slice(Math.max(0, i - 6), i + 1);
      const apres = texte.slice(i + v.length - 1);
      const precedeExclu = PRECEDENTS_EXCLUS.some((p) => avant.endsWith(p)) && !v.startsWith(" bin ");
      const homonyme = /^ (bin|bint) /.test(apres) && !completes.some((c) => texte.startsWith(c, i));
      if (!precedeExclu && !homonyme) return true;
      i = texte.indexOf(v, i + 1);
    }
  }
  return false;
}

function arabeNorm(s) {
  return s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[^ء-ي]/g, "");
}

// Index texte arabe → numéro dans la source affichable (hadith-api), les numérotations différant des fichiers anglais.
// Texte entier comparé (le début est souvent la même chaîne de transmission) ; repli sur le texte sans la fin, seulement s'il est unique.
function indexHadithApi(fichier) {
  const entier = new Map();
  const debut = new Map();
  for (const h of JSON.parse(readFileSync(join(SOURCES, fichier), "utf8")).hadiths) {
    const k = arabeNorm(h.text);
    if (!entier.has(k)) entier.set(k, h.hadithnumber);
    const d = k.slice(0, Math.floor(k.length * 0.9));
    debut.set(d, debut.has(d) ? null : h.hadithnumber);
  }
  return {
    get(texte) {
      const k = arabeNorm(texte);
      return entier.get(k) ?? debut.get(k.slice(0, Math.floor(k.length * 0.9))) ?? null;
    },
  };
}

function sourceArabe(cle, h, index) {
  if (cle === "bukhari" || cle === "malik") {
    const n = index[cle].get(arabeNorm(h.arabic));
    return n ? `hadith-api n° ${n}` : "arabe introuvable";
  }
  const n = cle === "riyad_assalihin" ? trouveRiyad(h.arabic) : trouveBulugh(h.arabic);
  return n ? `OpenITI n° ${n}` : "arabe introuvable";
}

function chargeCompagnons() {
  const ts = readFileSync(join(RACINE, "src/data/config.ts"), "utf8").split("// --- Compagnons ---")[1];
  const re = /\{ id: (\d+), slug: "([^"]+)", nom: \{ arabe: "([^"]+)", transliteration: "((?:[^"\\]|\\.)+)" \}/g;
  return [...ts.matchAll(re)].map((m) => ({
    id: Number(m[1]),
    slug: m[2],
    arabe: m[3],
    nom: m[4].replace(/\\'/g, "'"),
    variantes: (VARIANTES[m[1]] ?? []).map(norm),
  }));
}

function nettoieRapporteur(r) {
  return r
    .replace(/\(.*?\)/g, "")
    .replace(/^(It was narrated (from|that)|Narrated( by)?)\s*/i, "")
    .replace(/\b(reported|said|narrated).*$/i, "")
    .replace(/[:\s]+$/, "")
    .trim();
}

const compagnons = chargeCompagnons();
const sansVariantes = compagnons.filter((c) => c.variantes.length === 0);
if (sansVariantes.length) throw new Error(`Variantes manquantes : ${sansVariantes.map((c) => c.id).join(", ")}`);

const index = { bukhari: indexHadithApi("ara-bukhari.json"), malik: indexHadithApi("ara-malik.json") };
const resultats = new Map(compagnons.map((c) => [c.id, { A: [], B: [], R: [], X: {} }]));
const rapporteursInconnus = new Map();

for (const recueil of RECUEILS) {
  const { hadiths, chapters } = JSON.parse(readFileSync(join(SOURCES, `${recueil.cle}.json`), "utf8"));
  const livres = new Map(chapters.map((c) => [c.id, c.english]));
  for (const h of hadiths) {
    let rapporteurBrut = h.english.narrator ?? "";
    let texteBrut = h.english.text ?? "";
    // Al-Muwatta : chaîne dans le texte (« Yahya related to me from Malik from ... that ... ») → coupée au premier that/said.
    if (!rapporteurBrut.trim()) {
      const m = texteBrut.match(/^((?:Yahya|Malik)\b.*?\bfrom\b.*?)\b(that|said|say|says|used to)\b/is);
      if (m) [rapporteurBrut, texteBrut] = [m[1], texteBrut.slice(m[1].length)];
    }
    const rapporteur = norm(rapporteurBrut);
    const texte = norm(texteBrut);
    const chaineDansTexte = rapporteur.trim() === "";
    const livreCompagnons = recueil.livresCompagnons.includes(h.chapterId);
    const livreRecit = recueil.livresRecit.includes(h.chapterId);
    const reconnu = compagnons.some((c) => trouve(rapporteur, c.variantes));
    // Rapporteur Successeur (« Narrated Nafi`: Ibn `Umar said... ») : le Compagnon cité seulement en tête du texte en est le vrai rapporteur.
    const tete = norm(texteBrut.slice(0, 60));
    const suite = norm(texteBrut.slice(60));
    for (const c of compagnons) {
      const enTeteSeulement = !reconnu && trouve(tete, c.variantes) && !trouve(suite, c.variantes);
      const dansTexte = trouve(texte, c.variantes) && !enTeteSeulement;
      const dansRapporteur = trouve(rapporteur, c.variantes) || enTeteSeulement;
      if (!dansTexte && !dansRapporteur) continue;
      const r = resultats.get(c.id);
      const fiche = {
        recueil: recueil.nom,
        numero: h.idInBook,
        livre: livres.get(h.chapterId) ?? h.chapterId,
        arabe: sourceArabe(recueil.cle, h, index),
        extrait: `${h.english.narrator ?? ""} ${h.english.text ?? ""}`.replace(/\s+/g, " ").trim().slice(0, 220),
        texte: `${h.english.narrator ?? ""} ${h.english.text ?? ""}`.replace(/\s+/g, " ").trim(),
      };
      if (dansTexte && livreCompagnons && !chaineDansTexte) r.A.push({ ...fiche, raison: "nommé dans le texte, livre consacré aux Compagnons" });
      else if (dansTexte) r.B.push({ ...fiche, raison: chaineDansTexte ? "nommé (chaîne et texte non séparés)" : "nommé dans le texte" });
      else if (livreCompagnons || livreRecit) r.R.push({ ...fiche, raison: "rapporteur dans un livre consacré / Maghazi : récit personnel possible" });
      else r.X[recueil.nom] = (r.X[recueil.nom] ?? 0) + 1;
    }
    const brut = nettoieRapporteur(h.english.narrator ?? "");
    if (!reconnu && brut) rapporteursInconnus.set(brut, (rapporteursInconnus.get(brut) ?? 0) + 1);
  }
}

rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(SORTIE, { recursive: true });

const pad = (n) => String(n).padStart(3, "0");
const ligneFiche = (f) => `- **${f.recueil} ${f.numero}** — ${f.livre} — arabe : ${f.arabe} — _${f.raison}_\n  > ${f.extrait}`;

let resume = `# Candidats par Compagnon (premier jet automatique)\n\n`;
resume += `A = nommé dans le texte d'un livre consacré aux Compagnons ; B = nommé dans le texte ailleurs (à relire) ; R = rapporteur dans un livre consacré ou Al-Maghazi (récit personnel possible) ; X = rapporteur seulement (exclu).\n\n`;
resume += `| id | Compagnon | A | B | R | X |\n|---|---|---|---|---|---|\n`;
for (const c of compagnons) {
  const r = resultats.get(c.id);
  const x = Object.values(r.X).reduce((a, b) => a + b, 0);
  resume += `| ${c.id} | [${c.nom}](${pad(c.id)}-${c.slug}.md) | ${r.A.length} | ${r.B.length} | ${r.R.length} | ${x} |\n`;
  let fiche = `# ${c.id}. ${c.nom} — ${c.arabe}\n\nVariantes cherchées : ${VARIANTES[c.id].join(", ")}\n\nRapporteur seulement (exclu) : ${JSON.stringify(r.X)}\n`;
  for (const [cat, titre] of [["A", "A — forts"], ["R", "R — récit personnel possible"], ["B", "B — à relire"]]) {
    fiche += `\n## ${titre} (${r[cat].length})\n\n${r[cat].map(ligneFiche).join("\n") || "_aucun_"}\n`;
  }
  writeFileSync(join(SORTIE, `${pad(c.id)}-${c.slug}.md`), fiche);
}

resume += `\n## Rapporteurs fréquents non reconnus (Compagnons absents de la liste ou Successeurs)\n\n`;
resume += [...rapporteursInconnus].sort((a, b) => b[1] - a[1]).slice(0, 60).map(([n, k]) => `- ${n} (${k})`).join("\n") + "\n";
resume += `\n## Retirés de la liste (moins de 3 faits sur eux dans les quatre recueils)\n\n`;
resume += RETIRES.map(([n, raison]) => `- ${n} : ${raison}`).join("\n") + "\n";
writeFileSync(join(SORTIE, "resume.md"), resume);
// Entrée du filtre Mistral (scripts/filtre-mistral.mjs) : candidats A/R/B avec texte anglais complet.
const candidats = compagnons.map((c) => ({ id: c.id, slug: c.slug, nom: c.nom, variantes: VARIANTES[c.id], ...resultats.get(c.id) }));
writeFileSync(join(SORTIE, "candidats.json"), JSON.stringify(candidats));

console.log(`${compagnons.length} Compagnons analysés → ${SORTIE}`);
