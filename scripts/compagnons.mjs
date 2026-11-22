// Repère, pour chaque Compagnon de src/data/config.ts, les hadiths candidats dans les quatre recueils (outil interne, ne décide rien).
// Usage : npm run compagnons → écrit analyse/compagnons/ (resume.md + un fichier par Compagnon).
// Repérage sur les fichiers anglais hadith-json (rapporteur séparé du texte), texte arabe affichable retrouvé dans hadith-api / OpenITI.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { trouveBulugh } from "./openiti-bulugh.mjs";

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
const VARIANTES = {
  1: ["Abu Bakr", "Abu Bakr As-Siddiq", "As-Siddiq"],
  2: ["Umar", "Umar bin Al-Khattab"],
  3: ["Uthman", "Uthman bin Affan"],
  4: ["Ali", "Ali bin Abi Talib"],
  5: ["Talha", "Talha bin Ubaidullah"],
  6: ["Az-Zubair", "Zubair", "Az-Zubair bin Al-Awwam"],
  7: ["Abdur-Rahman bin Auf", "Abdul Rahman bin Auf", "Ibn Auf"],
  8: ["Sa`d bin Abi Waqqas", "Sa`d bin Malik"],
  9: ["Sa`id bin Zaid"],
  10: ["Abu Ubaida", "Abu Ubaida bin Al-Jarrah"],
  11: ["Khadija", "Khadija bint Khuwailid"],
  12: ["Aisha", "Aisha bint Abi Bakr"],
  13: ["Fatima", "Fatima bint Muhammad"],
  14: ["Hafsa", "Hafsa bint Umar"],
  15: ["Umm Salama"],
  16: ["Hamza", "Hamza bin Abdul Muttalib"],
  17: ["Al-Abbas", "Abbas", "Al-Abbas bin Abdul Muttalib"],
  18: ["Al-Hasan bin Ali", "Hasan bin Ali"],
  19: ["Al-Husain bin Ali", "Husain bin Ali"],
  20: ["Ibn Abbas", "Abdullah bin Abbas"],
  21: ["Ibn Umar", "Abdullah bin Umar"],
  22: ["Ibn Mas`ud", "Abdullah bin Mas`ud"],
  23: ["Abu Huraira"],
  24: ["Anas", "Anas bin Malik"],
  25: ["Jabir", "Jabir bin Abdullah"],
  26: ["Abu Sa`id Al-Khudri", "Abu Sa`id"],
  27: ["Abdullah bin Amr", "Abdullah bin Amr bin Al-As"],
  28: ["Mu`adh", "Mu`adh bin Jabal"],
  29: ["Ubai bin Ka`b", "Ubaiy bin Ka`b", "Ubayy bin Ka`b"],
  30: ["Zaid bin Thabit"],
  31: ["Abu Musa", "Abu Musa Al-Ash`ari"],
  32: ["Abu Dharr"],
  33: ["Salman", "Salman Al-Farisi"],
  34: ["Bilal", "Bilal bin Rabah"],
  35: ["Ammar", "Ammar bin Yasir"],
  36: ["Abu Ad-Darda", "Abu Darda", "Abu Al-Darda"],
  37: ["Khalid bin Al-Walid", "Khalid bin Walid"],
  38: ["Amr bin Al-As", "Amr bin Al-Aas"],
  39: ["Mu`awiya", "Mu`awiya bin Abi Sufyan"],
  40: ["Sa`d bin Mu`adh"],
  41: ["Sa`d bin Ubada"],
  42: ["Usama", "Usama bin Zaid"],
  43: ["Zaid bin Haritha"],
  44: ["Ja`far", "Ja`far bin Abi Talib"],
  45: ["Mus`ab bin Umair"],
  46: ["Abdullah bin Rawaha", "Ibn Rawaha"],
  47: ["Hudhaifa", "Hudhaifa bin Al-Yaman"],
  48: ["Abu Ayyub", "Abu Aiyub", "Abu Ayyub Al-Ansari"],
  49: ["Al-Bara", "Al-Bara bin Azib", "Bara bin Azib"],
  50: ["Abu Talha"],
  51: ["Umm Sulaim"],
  52: ["Asma", "Asma bint Abi Bakr"],
  53: ["Sauda", "Sawda", "Sauda bint Zam`a"],
  54: ["Zainab bint Jahsh"],
  55: ["Maimuna", "Maimuna bint Al-Harith"],
  56: ["Umm Habiba"],
  57: ["Juwairiya", "Juwairiyya"],
  58: ["Safiya", "Safiyya", "Safiya bint Huyai"],
  59: ["Sumaiya", "Sumayya"],
  60: ["Abdullah bin Az-Zubair", "Ibn Az-Zubair", "Ibn Zubair"],
  61: ["Imran bin Husain"],
  62: ["Abu Qatada"],
  63: ["Sahl", "Sahl bin Sa`d"],
  64: ["An-Nu`man bin Bashir", "Nu`man bin Bashir"],
  65: ["Ubada", "Ubada bin As-Samit"],
  66: ["Abu Bakra"],
  67: ["Jarir", "Jarir bin Abdullah"],
  68: ["Al-Mughira", "Al-Mughira bin Shu`ba", "Mughira bin Shu`ba"],
  69: ["Abu Umama"],
  70: ["Uqba bin Amir"],
  71: ["Abu Mas`ud", "Abu Mas`ud Al-Ansari"],
  72: ["Tamim Ad-Dari"],
  73: ["Suhaib"],
  74: ["Khabbab", "Khabbab bin Al-Aratt"],
  75: ["Al-Miqdad", "Miqdad"],
  76: ["Itban", "Itban bin Malik", "Utban bin Malik"],
  77: ["Ka`b bin Malik"],
  78: ["Hassan bin Thabit"],
  79: ["Abdullah bin Salam"],
  80: ["Abu Sufyan", "Abu Sufyan bin Harb"],
  81: ["Ikrima bin Abi Jahl"],
  82: ["Salim Maula Abi Hudhaifa", "Salim Mawla Abi Hudhaifa", "Salim, the freed slave of Abu Hudhaifa"],
  83: ["Abu Hudhaifa", "Abu Hudhaifa bin Utba"],
  84: ["Uthman bin Maz`un", "Uthman bin Madh`un"],
  85: ["Anas bin An-Nadr", "Anas bin Nadr"],
  86: ["Al-Arqam"],
  87: ["Umm Aiman", "Umm Ayman"],
  88: ["Umm Atiya", "Umm Atiyya"],
  89: ["Ruqaiya", "Ruqayya"],
  90: ["Zainab bint Muhammad", "Zainab, the daughter of the Prophet"],
  91: ["Umm Kulthum bint Muhammad"],
  92: ["Al-Fadl", "Al-Fadl bin Abbas"],
  93: ["Thabit bin Qais"],
  94: ["Zaid bin Arqam"],
  95: ["Abdullah bin Mughaffal"],
  96: ["Wa`il bin Hujr"],
  97: ["Abu Juhaifa"],
  98: ["Rafi` bin Khadij"],
  99: ["Samura", "Samura bin Jundab"],
  100: ["Asma bint Umais"],
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
    .replace(/[^ء-ي]/g, "")
    .slice(0, 80);
}

// Index texte arabe → numéro dans la source affichable (hadith-api), les numérotations différant des fichiers anglais.
function indexHadithApi(fichier) {
  const index = new Map();
  for (const h of JSON.parse(readFileSync(join(SOURCES, fichier), "utf8")).hadiths) {
    const k = arabeNorm(h.text);
    if (!index.has(k)) index.set(k, h.hadithnumber);
  }
  return index;
}

// Riyad as-Salihin OpenITI : un hadith par bloc « ### ||| N/... », N = numéro du recueil.
function indexOpenitiRiyad() {
  const texte = readFileSync(join(SOURCES, "openiti-riyad-assalihin.mARkdown"), "utf8");
  const numeros = new Set();
  for (const m of texte.matchAll(/^### \|\|\| (\d+)\//gm)) numeros.add(Number(m[1]));
  return numeros;
}

function sourceArabe(cle, h, index) {
  if (cle === "bukhari" || cle === "malik") {
    const n = index[cle].get(arabeNorm(h.arabic));
    return n ? `hadith-api n° ${n}` : "arabe introuvable";
  }
  if (cle === "riyad_assalihin") return index.riyad.has(h.idInBook) ? `OpenITI n° ${h.idInBook}` : "arabe introuvable";
  const n = trouveBulugh(h.arabic);
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

const index = { bukhari: indexHadithApi("ara-bukhari.json"), malik: indexHadithApi("ara-malik.json"), riyad: indexOpenitiRiyad() };
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
writeFileSync(join(SORTIE, "resume.md"), resume);
// Entrée du filtre Mistral (scripts/filtre-mistral.mjs) : candidats A/R/B avec texte anglais complet.
const candidats = compagnons.map((c) => ({ id: c.id, slug: c.slug, nom: c.nom, variantes: VARIANTES[c.id], ...resultats.get(c.id) }));
writeFileSync(join(SORTIE, "candidats.json"), JSON.stringify(candidats));

console.log(`${compagnons.length} Compagnons analysés → ${SORTIE}`);
