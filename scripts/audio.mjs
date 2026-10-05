// Télécharge l'audio d'une sourate (un mp3 par verset, EveryAyah) pour chaque récitateur, sans minutage mot à mot (`Verset.audio` = []).
// Usage : npm run audio -- 1 [110 ...]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const EVERYAYAH = {
  "al-hussary": "Husary_128kbps",
  "al-houdaifi": "Hudhaify_128kbps",
};

function erreur(message) {
  throw new Error(message);
}

function dossierSourate(sourate) {
  const resume = readFileSync(`${RACINE}/src/data/summary.ts`, "utf8");
  const slug = resume.match(new RegExp(`\\{ id: ${sourate}, slug: "([^"]+)"`))?.[1] ?? erreur(`sourate ${sourate} absente de summary.ts`);
  return `${String(sourate).padStart(3, "0")}-${slug}`;
}

async function telecharger(url, destination) {
  const reponse = await fetch(url);
  if (!reponse.ok) erreur(`${url} : HTTP ${reponse.status}`);
  writeFileSync(destination, Buffer.from(await reponse.arrayBuffer()));
}

for (const arg of process.argv.slice(2)) {
  const sourate = Number(arg);
  const fichier = `${RACINE}/src/data/sourates/sourate_${String(sourate).padStart(3, "0")}.ts`;
  const source = readFileSync(fichier, "utf8");
  const numeros = [...source.matchAll(/^ {4}numero: (\d+),/gm)].map((m) => Number(m[1]));

  for (const [recitateur, everyayah] of Object.entries(EVERYAYAH)) {
    const dossier = `${RACINE}/public/assets/audio/${recitateur}/${dossierSourate(sourate)}`;
    mkdirSync(dossier, { recursive: true });
    for (const numero of numeros) {
      // Bismillah (verset 0) : même audio que le verset 1 d'Al-Fatiha.
      const cle = numero === 0 ? "001001" : `${String(sourate).padStart(3, "0")}${String(numero).padStart(3, "0")}`;
      await telecharger(`https://everyayah.com/data/${everyayah}/${cle}.mp3`, `${dossier}/${String(numero).padStart(2, "0")}.mp3`);
    }
  }

  // Bloc `audio` remplacé (ou ajouté en fin de verset) : audio présent pour chaque récitateur, sans surlignage.
  const audio = `    audio: { ${Object.keys(EVERYAYAH).map((r) => `"${r}": []`).join(", ")} },\n`;
  const resultat = source
    .split(/(?=^ {2}\{\n {4}numero: \d+,)/m)
    .map((bloc) => {
      if (!/^ {4}numero: \d+,/m.test(bloc)) return bloc;
      if (/^ {4}audio: \{/m.test(bloc)) return bloc.replace(/^ {4}audio: \{[\s\S]*?\n? *\},\n/m, audio);
      return bloc.replace(/^ {2}\},?\n(?![\s\S]*^ {2}\})/m, (fin) => `${audio}${fin}`);
    })
    .join("");
  writeFileSync(fichier, resultat);
  console.log(`sourate ${sourate} : ${numeros.length} versets, audio ${Object.keys(EVERYAYAH).join(" + ")} téléchargé`);
}
