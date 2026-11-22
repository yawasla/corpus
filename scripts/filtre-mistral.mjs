// Filtre les candidats de scripts/compagnons.mjs avec l'API Mistral : le hadith révèle-t-il une qualité du Compagnon ? (aide au tri, ne décide rien).
// Usage : npm run filtre -- <id> [<id>...] | tous | test <fichier> | synthese <id>...   (clé MISTRAL_API_KEY dans .env.local)
// Résultats en cache dans analyse/mistral/NNN-slug.json (relance = seuls les hadiths non traités sont envoyés) + NNN-slug.md (hadiths retenus).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANDIDATS = join(RACINE, "analyse/compagnons/candidats.json");
const SORTIE = join(RACINE, "analyse/mistral");
const MODELE = process.env.MODELE || "mistral-medium-latest"; // MODELE=mistral-medium-latest npm run filtre -- ...
const PARALLELE = 1;
const PAUSE_MS = 600; // ~2 requêtes/s

function cleApi() {
  if (process.env.MISTRAL_API_KEY) return process.env.MISTRAL_API_KEY;
  const env = join(RACINE, ".env.local");
  const m = existsSync(env) && readFileSync(env, "utf8").match(/^MISTRAL_API_KEY=(.+)$/m);
  if (!m) throw new Error("MISTRAL_API_KEY absente (.env.local)");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

// Consigne en anglais comme les textes analysés, ajustée sur l'échantillon validé analyse/mistral/001-abu-bakr-test.json (erreurs types : liste de noms, autre personne, fin de texte ratée, traits vagues).
const CONSIGNE = `You help write short profiles of Companions of the Prophet. A hadith is kept only for what it reveals about the qualities of the given Companion, never for its legal content. Read the WHOLE text: the useful information is often at the end.

role:
- "subject": the Companion acts or speaks in the scene and plays a part in it, OR the Prophet or another Companion says something about him (praise, rank, testimony, a dream about him);
- "mention": he is only named (in a list, as present, as a reference) without anything being shown about him;
- "narrator": he only transmits the hadith without playing a part in it;
- "homonym": the name refers to someone else.

verdict = "yes" only if role is "subject" AND the text shows at least one of:
1. an act or words of the Companion himself revealing a quality (including his own story when he plays a part in it);
2. a statement by the Prophet or another Companion about him (praise, rank, testimony);
3. a key event of his life in which he plays a part (e.g. the Hijra, a duty entrusted by the Prophet, his caliphate).

verdict = "no" in every other case, in particular:
- homonym or lineage: the name refers to someone else ("X bint Abi Bakr", "Y ibn Abi Bakr", "Abu Bakr ibn Hazm");
- mere listing or shared practice ("the Prophet, Abu Bakr and Umar used to..."), or mere presence beside the Prophet;
- a hadith centred on another person: never attribute to him the words or qualities of someone else;
- plain narration of the Prophet's words without a part in the scene;
- ask "what do we learn about him as a person?": if the only answer is how a practice is done (ablution, prayer, pilgrimage, inheritance, punishment), verdict "no";
- anything after his death (grave, prayers for him, descendants);
- physical description, administrative act, passing on an object or a rule, order of precedence;
- trivial act or plain news: passing on information, saying "let us go", sealing a letter, news that he became caliph while he does nothing in the scene;
- an act done by someone else (e.g. his daughter preparing the journey food) must never be attributed to him;
- ranking or comparison of merit between Companions ("the best of the Companions", "better than X", "none is like him"), including the Prophet's preference for one Companion ("if I were to take a Khalil", "the one who favored me most", "the most beloved"): the corpus puts all Companions on the same level; verdict "no" unless the text also shows a quality of his own;
- a scene of correction or disagreement from which no quality emerges.

verdict = "review" when the quality depends on an interpretation or a legal (fiqh) question (a dream, a judgement he gives, a confession of sin brought to him): a human will decide.

Examples (Companion: Abu Bakr):
- "If I were to take a Khalil, I would have taken Abu Bakr" -> subject, "no" (a preference of the Prophet: the corpus does not rank Companions)
- "Be firm, O Uhud! On you there are no more than a Prophet, a Siddiq and two martyrs" -> subject, "yes", trait "called Siddiq by the Prophet"
- "The Prophet, Abu Bakr and Umar used to begin the prayer with Al-hamdu lillah" -> mention, "no"
- "Asma bint Abi Bakr said: a woman asked the Prophet..." -> homonym, "no"
- a long narrative where, late in the text, Umar says "none of you is like Abu Bakr" or "he was the companion of the cave" -> subject, "yes"
- "I saw Abu Bakr eat meat and then pray without doing wudu" -> subject, "no" (only a practice)
- "A man confessed adultery to Abu Bakr, who told him to cover it with the veil of Allah and repent" -> subject, "review"

Writing (in English):
- trait: one concrete, positive fact (3 to 10 words), never a general adjective or superlative (forbidden: absolute, unwavering, deep, total);
- episode: the scene in 1 to 4 words (e.g. "Hijra", "death of the Prophet", "cave of Thawr"), used to group duplicates;
- passage: EXACT short quote from the text, no paraphrase;
- interpretation: true if the trait needs a scholarly explanation not stated in the text (dream, symbol);
- no opinion on authenticity or legal scope.

Answer only in JSON: {"role": "subject"|"mention"|"narrator"|"homonym", "verdict": "yes"|"no"|"review", "trait": "", "episode": "", "passage": "", "interpretation": false}. If verdict is "no", leave trait, episode and passage empty.`;

async function classe(cle, compagnon, h) {
  const contenu = `Compagnon : ${compagnon.nom} (noms possibles : ${compagnon.variantes.join(", ")})\nRéférence : ${h.recueil} ${h.numero} — ${h.livre}\nTexte : ${h.texte}`;
  for (let essai = 1; ; essai++) {
    const rep = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELE,
        temperature: 0,
        top_p: 1,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: CONSIGNE }, { role: "user", content: contenu }],
      }),
    });
    // 429 / 5xx : on attend et on réessaie (3 fois max).
    if ((rep.status === 429 || rep.status >= 500) && essai < 6) {
      await new Promise((r) => setTimeout(r, 5000 * essai));
      continue;
    }
    if (!rep.ok) throw new Error(`Mistral ${rep.status} : ${await rep.text()}`);
    const json = await rep.json();
    const r = JSON.parse(json.choices[0].message.content);
    const normal = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
    return {
      role: r.role ?? "",
      utile: r.verdict === "yes",
      aTrancher: r.verdict === "review",
      trait: r.trait ?? "",
      episode: r.episode ?? "",
      interpretation: r.interpretation === true,
      passage: r.passage ?? "",
      // Garde-fou : un passage absent du texte signale une réponse inventée.
      passageRetrouve: !r.passage || normal(h.texte).includes(normal(r.passage)),
      jetons: json.usage,
    };
  }
}

// Synthèse : un appel par Compagnon sur ses hadiths retenus → traits majeurs, un hadith principal chacun, doublons regroupés.
const MAX_TRAITS = 50; // large choix : scripts/fiche.mjs n'en garde que 25 (ids 1–4) ou 15
const CONSIGNE_SYNTHESE = (max) => `You receive the hadiths kept for one Companion of the Prophet, one per line: ref | trait | episode | quote.
Group the hadiths that show the same scene or the same quality, then return at most ${max} major traits, SORTED BY IMPORTANCE (most significant qualities and events of his life first, minor details last).
Each trait must show a distinct quality or scene, only once: never split one scene (e.g. the Hijra) into several traits.
For each trait: a concrete, positive fact (3 to 12 words, no superlatives), the main hadith (the clearest quote), and ALL the refs of the other hadiths showing the same thing, from every collection.
Never keep a trait based on ranking or comparing Companions ("the best", "better than X", "none is like him", "the most..."), including the Prophet's preference for him ("if I were to take a Khalil", "the one who favored me most"): describe what he did, not his rank or a preference. Never pick a main hadith whose quote is a comparison.
Use only refs from the list. Do not invent anything.
Answer only in JSON: {"traits": [{"trait": "", "episode": "", "main": "ref", "others": ["ref"]}]}`;

async function synthese(cle, c) {
  const fichier = join(SORTIE, `${String(c.id).padStart(3, "0")}-${c.slug}.json`);
  const cache = JSON.parse(readFileSync(fichier, "utf8"));
  const retenus = Object.entries(cache).filter(([, r]) => r.utile);
  const liste = retenus.map(([ref, r]) => `${ref} | ${r.trait} | ${r.episode} | ${r.passage.slice(0, 160)}`).join("\n");
  const rep = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0,
      top_p: 1,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: CONSIGNE_SYNTHESE(MAX_TRAITS) }, { role: "user", content: `Companion: ${c.nom}\n${liste}` }],
    }),
  });
  if (!rep.ok) throw new Error(`Mistral ${rep.status} : ${await rep.text()}`);
  const json = await rep.json();
  const { traits } = JSON.parse(json.choices[0].message.content);
  // Garde-fou : une référence absente des hadiths retenus est signalée (réponse inventée).
  const connu = (ref) => (cache[ref]?.utile ? "" : " ⚠️ réf. inconnue");
  const md =
    `# ${c.id}. ${c.nom} — synthèse (${traits.length} traits, ${retenus.length} hadiths retenus)\n\n` +
    traits
      .map((t, i) => {
        const p = cache[t.main] ?? {};
        return `${i + 1}. **${t.trait}** (${t.episode})\n   - principal : ${t.main}${connu(t.main)} — arabe : ${p.arabe ?? "?"}\n     > ${p.passage ?? ""}\n   - autres : ${(t.others ?? []).map((r) => r + connu(r)).join(", ") || "—"}`;
      })
      .join("\n") +
    "\n";
  writeFileSync(join(SORTIE, `${String(c.id).padStart(3, "0")}-${c.slug}-synthese.md`), md);
  // Entrée de scripts/fiche.mjs (préremplissage de src/data/compagnons/compagnon_NNN.ts).
  writeFileSync(join(SORTIE, `${String(c.id).padStart(3, "0")}-${c.slug}-synthese.json`), JSON.stringify(traits.map((t) => ({ ...t, source: cache[t.main] ?? null })), null, 1));
  console.log(`${c.id}. ${c.nom} : ${traits.length} traits | jetons ${json.usage?.prompt_tokens} / ${json.usage?.completion_tokens}`);
}

const args = process.argv.slice(2);
if (args[0] === "synthese") {
  const tousC = JSON.parse(readFileSync(CANDIDATS, "utf8"));
  for (const c of tousC.filter((x) => args.slice(1).map(Number).includes(x.id))) await synthese(cleApi(), c);
  process.exit(0);
}
if (!args.length) throw new Error("Usage : npm run filtre -- <id> [<id>...] | tous | test <fichier-test.json>");

// Mode test : relance la consigne sur un échantillon validé à la main et compare (résultat écrit dans le champ "essai").
if (args[0] === "test") {
  const fichierTest = join(SORTIE, args[1]);
  const test = JSON.parse(readFileSync(fichierTest, "utf8"));
  const compagnon = JSON.parse(readFileSync(CANDIDATS, "utf8")).find((c) => args[1].startsWith(`${String(c.id).padStart(3, "0")}-`));
  const jetons = { entree: 0, sortie: 0 };
  for (const h of test) {
    const [recueil, numero] = [h.ref.replace(/ \d+$/, ""), h.ref.match(/\d+$/)[0]];
    const { jetons: j, ...r } = await classe(cleApi(), compagnon, { recueil, numero, livre: h.livre, texte: h.texte });
    jetons.entree += j?.prompt_tokens ?? 0;
    jetons.sortie += j?.completion_tokens ?? 0;
    h.essais = { ...h.essais, [MODELE]: r };
    await new Promise((res) => setTimeout(res, PAUSE_MS));
  }
  writeFileSync(fichierTest, JSON.stringify(test, null, 1));
  const tranches = test.filter((h) => h.validation.verdict !== "review");
  const r = h => h.essais[MODELE];
  const fauxOui = tranches.filter((h) => r(h).utile && h.validation.verdict === "no");
  const rates = tranches.filter((h) => !r(h).utile && !r(h).aTrancher && h.validation.verdict === "yes");
  const renvois = tranches.filter((h) => r(h).aTrancher);
  const num = (l) => l.map((h) => test.indexOf(h) + 1).join(", ");
  const justes = tranches.length - fauxOui.length - rates.length - renvois.length;
  console.log(`${MODELE} : ${justes}/${tranches.length} justes (${Math.round((100 * justes) / tranches.length)} %), renvoyés à trancher ${renvois.length} [${num(renvois)}]`);
  console.log(`faux oui ${fauxOui.length} [${num(fauxOui)}] | ratés ${rates.length} [${num(rates)}]`);
  console.log(`passages non retrouvés : ${test.filter((h) => r(h).utile && !r(h).passageRetrouve).length} | jetons ${jetons.entree} / ${jetons.sortie}`);
  process.exit(0);
}

const tous = JSON.parse(readFileSync(CANDIDATS, "utf8"));
const choisis = args[0] === "tous" ? tous : tous.filter((c) => args.map(Number).includes(c.id));
const cle = cleApi();
mkdirSync(SORTIE, { recursive: true });
const total = { entree: 0, sortie: 0, appels: 0 };
const pad = (n) => String(n).padStart(3, "0");

for (const c of choisis) {
  const fichier = join(SORTIE, `${pad(c.id)}-${c.slug}.json`);
  const cache = existsSync(fichier) ? JSON.parse(readFileSync(fichier, "utf8")) : {};
  const aTraiter = [...c.A.map((h) => ({ ...h, cat: "A" })), ...c.R.map((h) => ({ ...h, cat: "R" })), ...c.B.map((h) => ({ ...h, cat: "B" }))].filter(
    (h) => !cache[`${h.recueil} ${h.numero}`]
  );
  for (let i = 0; i < aTraiter.length; i += PARALLELE) {
    const lot = aTraiter.slice(i, i + PARALLELE);
    const reponses = await Promise.all(lot.map((h) => classe(cle, c, h)));
    lot.forEach((h, k) => {
      const { jetons, ...r } = reponses[k];
      total.entree += jetons?.prompt_tokens ?? 0;
      total.sortie += jetons?.completion_tokens ?? 0;
      total.appels++;
      cache[`${h.recueil} ${h.numero}`] = { cat: h.cat, livre: h.livre, arabe: h.arabe, extrait: h.extrait, ...r };
    });
    writeFileSync(fichier, JSON.stringify(cache, null, 1));
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
  const retenus = Object.entries(cache).filter(([, r]) => r.utile);
  const aTrancher = Object.entries(cache).filter(([, r]) => r.aTrancher);
  const ligne = ([ref, r]) => `- **${ref}** (${r.cat}) — **${r.trait}**${r.passageRetrouve ? "" : " ⚠️ passage non retrouvé"} — arabe : ${r.arabe}\n  > ${r.passage}`;
  // Regroupement par épisode : les doublons (même scène, plusieurs chaînes) se suivent pour la relecture.
  const episodes = new Map();
  for (const e of retenus) {
    const k = (e[1].episode || "—").toLowerCase();
    episodes.set(k, [...(episodes.get(k) ?? []), e]);
  }
  const md =
    `# ${c.id}. ${c.nom} — ${retenus.length} retenus, ${aTrancher.length} à trancher, sur ${Object.keys(cache).length}\n\n## Retenus par épisode (${episodes.size})\n\n` +
    [...episodes].sort((a, b) => b[1].length - a[1].length).map(([ep, l]) => `### ${ep} (${l.length})\n\n${l.map(ligne).join("\n")}`).join("\n\n") +
    `\n\n## À trancher\n\n${aTrancher.map(ligne).join("\n") || "_aucun_"}\n`;
  writeFileSync(join(SORTIE, `${pad(c.id)}-${c.slug}.md`), md);
  console.log(`${c.id}. ${c.nom} : ${aTraiter.length} envoyés, ${retenus.length} retenus, ${aTrancher.length} à trancher, ${episodes.size} épisodes`);
}
console.log(`${total.appels} appels, jetons entrée ${total.entree}, sortie ${total.sortie} (${MODELE})`);
