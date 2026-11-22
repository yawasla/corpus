// Traduit avec Mistral les traits (anglais → fr/es/ar) et les hadiths (arabe → fr/en/es) d'une fiche Compagnon, premier jet à relire.
// Usage : npm run traduction -- <id>   → ne remplit que les champs vides de src/data/compagnons/compagnon_NNN.ts (traductions relues jamais écrasées).
// Hadiths traduits depuis l'arabe uniquement (jamais depuis une traduction tierce) : traductions sous CC BY-NC-SA pour les textes OpenITI (CLAUDE.md).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODELE = process.env.MODELE || "mistral-medium-latest";
const PAUSE_MS = 600;

function cleApi() {
  if (process.env.MISTRAL_API_KEY) return process.env.MISTRAL_API_KEY;
  const m = readFileSync(join(RACINE, ".env.local"), "utf8").match(/^MISTRAL_API_KEY=(.+)$/m);
  if (!m) throw new Error("MISTRAL_API_KEY absente (.env.local)");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const jetons = { entree: 0, sortie: 0 };
async function appel(consigne, contenu) {
  for (let essai = 1; ; essai++) {
    const rep = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${cleApi()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELE,
        temperature: 0,
        top_p: 1,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: consigne }, { role: "user", content: contenu }],
      }),
    });
    if ((rep.status === 429 || rep.status >= 500) && essai < 6) {
      await new Promise((r) => setTimeout(r, 5000 * essai));
      continue;
    }
    if (!rep.ok) throw new Error(`Mistral ${rep.status} : ${await rep.text()}`);
    const json = await rep.json();
    jetons.entree += json.usage?.prompt_tokens ?? 0;
    jetons.sortie += json.usage?.completion_tokens ?? 0;
    await new Promise((r) => setTimeout(r, PAUSE_MS));
    return JSON.parse(json.choices[0].message.content);
  }
}

const REGLES = `Rules: always write the honorific ﷺ right after "the Prophet" / "le Prophète" / "el Profeta" / "النبي" (instead of translating "صلى الله عليه وسلم"); no superlatives added; keep proper names in their usual transliteration (Abu Bakr, Umar, Aisha...).`;

const CONSIGNE_TRAITS = `Translate each short English trait describing a Companion of the Prophet into French, Spanish and Arabic. Keep them short, factual and in the same order. ${REGLES}
Answer only in JSON: {"traits": [{"fr": "", "es": "", "ar": ""}]}`;

const CONSIGNE_HADITH = `Translate this hadith from Arabic into French, English and Spanish, faithfully and in plain modern language, without adding commentary.
For the chain of narrators, keep only the last narrator (the Companion), e.g. "Abu Bakr reported:" / "D'après Abu Bakr :" / "Según Abu Bakr:", then translate the rest of the text completely.
Formulas like "رضي الله عنه" are translated by the usual formula of each language. ${REGLES}
Answer only in JSON: {"fr": "", "en": "", "es": ""}`;

const id = Number(process.argv[2]);
if (!id) throw new Error("Usage : npm run traduction -- <id>");
const fichier = join(RACINE, `src/data/compagnons/compagnon_${String(id).padStart(3, "0")}.ts`);
if (!existsSync(fichier)) throw new Error(`Fiche absente : npm run fiche -- ${id}`);
const source = readFileSync(fichier, "utf8");
const fiche = JSON.parse(source.match(/= (\{[\s\S]*\});\s*$/)[1]);
const enregistre = () => writeFileSync(fichier, source.replace(/= \{[\s\S]*\};\s*$/, `= ${JSON.stringify(fiche, null, 2)};\n`));

// Traits : un seul appel pour tous ceux auxquels il manque une langue.
const traits = fiche.traits.filter(({ trait }) => !trait.fr || !trait.es || !trait.ar);
if (traits.length) {
  const { traits: tr } = await appel(CONSIGNE_TRAITS, traits.map((t, i) => `${i + 1}. ${t.trait.en}`).join("\n"));
  traits.forEach((t, i) => {
    for (const l of ["fr", "es", "ar"]) t.trait[l] ||= tr[i]?.[l] ?? "";
  });
  enregistre();
}

// Hadiths : un appel par hadith non traduit, enregistré aussitôt (relance = reprise).
let hadiths = 0;
for (const { hadith } of fiche.traits) {
  const manque = ["fr", "en", "es"].filter((l) => !hadith.traduction?.[l]);
  if (!manque.length) continue;
  const t = await appel(CONSIGNE_HADITH, `${hadith.recueil} ${hadith.numero}\n${hadith.arabe}`);
  hadith.traduction = { ...hadith.traduction };
  for (const l of manque) hadith.traduction[l] = t[l] ?? "";
  enregistre();
  hadiths++;
}
console.log(`${traits.length} traits, ${hadiths} hadiths traduits | jetons ${jetons.entree} / ${jetons.sortie} (${MODELE})`);
