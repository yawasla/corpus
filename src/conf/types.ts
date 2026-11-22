export type Langue = "fr" | "en" | "es" | "ar";

// Langues qui traduisent le texte arabe (fr/en/es) : l'arabe n'a rien à se traduire lui-même, donc pas de clé "ar" pour ces champs.
export type LangueTraduction = Exclude<Langue, "ar">;

export type Recitateur = "al-hussary" | "al-houdaifi";

export type Mot = {
  texte: string;
  transliteration: string;
  traduction: Record<LangueTraduction, string>;
  grammaire: Record<Langue, string>;
  // Généré par scripts/grammaire.mjs ; absent pour les mots sans racine (particules, pronoms...).
  racine?: { arabe: string; transliteration: string };
  couleur?: string;
};

export type Verset = {
  numero: number;
  mots: Mot[];
  traduction: Record<LangueTraduction, string>;
  // Départ ("mm:ss") de chaque mot dans le clip audio du verset ; [] = audio sans surlignage ; clé absente tant que ce récitateur n'a pas d'audio pour ce verset.
  audio?: Partial<Record<Recitateur, string[]>>;
};

export type NomSourate = {
  arabe: string;
  transliteration: string;
  sens?: Record<LangueTraduction, string>;
};

// Fiche Compagnon (src/data/compagnons/compagnon_NNN.ts, préremplie par scripts/fiche.mjs).
export type HadithFiche = {
  recueil: string;
  numero: number;
  // Texte arabe copié verbatim depuis sources/hadith (jamais modifié).
  arabe: string;
  degre: string;
  // Traduction Yawasla depuis l'arabe (scripts/traduction-mistral.mjs), relue à la main.
  traduction?: Partial<Record<LangueTraduction, string>>;
};

export type FicheCompagnon = {
  wikipedia: Record<Langue, string>;
  // Hadiths écartés à la relecture (« Sahih al-Bukhari 1472 ») avec la raison : jamais repris par scripts/fiche.mjs.
  exclus?: { ref: string; raison: string }[];
  resume: Record<Langue, string>;
  // Trait rédigé en anglais par la synthèse, traductions ajoutées à la relecture.
  // cle : trait d'origine de la synthèse, sert à retrouver les traductions quand la fiche est régénérée.
  // valide : entrée relue et verrouillée, jamais modifiée par les scripts. qualites : badges rédigés par nous à partir du fait (le fait vient de la synthèse Mistral), un ou plusieurs.
  traits: { trait: Partial<Record<Langue, string>> & { en: string; cle?: string; qualites?: Record<Langue, string>[] }; hadith: HadithFiche; valide?: boolean }[];
};
