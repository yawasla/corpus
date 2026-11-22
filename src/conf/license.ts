import type { Langue, Recitateur } from "@/conf/types";

export const NOMS_RECITATEURS: Record<Recitateur, Record<Langue, string>> = {
  "al-hussary": {
    fr: "Cheikh Mahmoud Khalil Al-Hussary",
    en: "Sheikh Mahmoud Khalil Al-Hussary",
    es: "Jeque Mahmoud Khalil Al-Hussary",
    ar: "الشيخ محمود خليل الحصري",
  },
  "al-houdaifi": {
    fr: "Cheikh Ali Al-Houdaifi",
    en: "Sheikh Ali Al-Houdaifi",
    es: "Jeque Ali Al-Houdaifi",
    ar: "الشيخ علي الحذيفي",
  },
};

export const GITHUB_URL = "https://github.com/yawasla/corpus";

export type Source = {
  nom: string;
  url: string;
  description: Record<Langue, string>;
  licence?: { nom: string; url: string };
};

export const SOURCES_CORAN: Source[] = [
  {
    nom: "Tanzil Project",
    url: "https://tanzil.net",
    description: {
      fr: "Texte arabe du Coran et traductions officielles (Hamidullah, Ahmed Ali, Bornez)",
      en: "Quranic Arabic text and official translations (Hamidullah, Ahmed Ali, Bornez)",
      es: "Texto árabe del Corán y traducciones oficiales (Hamidullah, Ahmed Ali, Bornez)",
      ar: "النص العربي للقرآن والترجمات الرسمية (حميد الله، أحمد علي، بورنيز)",
    },
  },
  {
    nom: "Quranic Arabic Corpus",
    url: "https://corpus.quran.com",
    description: {
      fr: "Analyse grammaticale mot-à-mot (Kais Dukes)",
      en: "Word-by-word grammatical analysis (Kais Dukes)",
      es: "Análisis gramatical palabra por palabra (Kais Dukes)",
      ar: "التحليل النحوي والصرفي كلمة بكلمة (كايس ديوكس)",
    },
  },
  {
    nom: "EveryAyah",
    url: "https://everyayah.com",
    description: {
      fr: "Récitations audio verset par verset (Al-Hussary, Al-Houdaifi)",
      en: "Verse-by-verse audio recitations (Al-Hussary, Al-Houdaifi)",
      es: "Recitaciones de audio verso por verso (Al-Hussary, Al-Houdaifi)",
      ar: "التلاوات الصوتية آيةً آية (الحصري، الحذيفي)",
    },
  },
];

// OpenITI (CC BY-NC-SA 4.0) : crédit + lien licence sur le site, URI des fichiers cités dans le README.
const CC_BY_NC_SA = { nom: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" };

export const SOURCES_COMPAGNONS: Source[] = [
  {
    nom: "hadith-api",
    url: "https://github.com/fawazahmed0/hadith-api",
    description: {
      fr: "Texte arabe de Sahih al-Bukhari et d'Al-Muwatta (domaine public)",
      en: "Arabic text of Sahih al-Bukhari and Al-Muwatta (public domain)",
      es: "Texto árabe de Sahih al-Bujari y Al-Muwatta (dominio público)",
      ar: "النص العربي لصحيح البخاري والموطأ (ملكية عامة)",
    },
  },
  {
    nom: "OpenITI",
    url: "https://kitab-project.org/docs/openITI",
    description: {
      fr: "Texte arabe de Riyad as-Salihin et Bulugh al-Maram",
      en: "Arabic text of Riyad as-Salihin and Bulugh al-Maram",
      es: "Texto árabe de Riyad as-Salihin y Bulugh al-Maram",
      ar: "النص العربي لرياض الصالحين وبلوغ المرام",
    },
    licence: CC_BY_NC_SA,
  },
];

