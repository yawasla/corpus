# Yawasla Corpus — Contexte projet

## Conventions

- Markdown : une phrase/un paragraphe par ligne, pas de retour à la ligne forcé au milieu.
- Commentaire : une ligne par commentaire tres synthetique sur des passages seulement ambigus
- Toujours « ﷺ » après « Prophète » (Prophet, Profeta, النبي) dans les textes affichés, y compris les traits et résumés.

## Optimisation des tokens

- Réponses courtes : ce qui a changé + ce qui reste à décider, pas de récapitulatif détaillé ni de tableau si une ligne suffit.
- Lire uniquement les lignes utiles (`grep -n`, `sed -n`), jamais un gros fichier entier (`sources/`, `src/data/sourates/`, `analyse/`).
- Sorties de commandes et de scripts limitées (`head`, `tail`, compteurs) ; un script écrit ses résultats dans un fichier et n'affiche qu'un résumé.
- Pas de vérification redondante : un build/lint par série de modifications, pas de relecture d'un fichier qu'on vient d'éditer.
- Pas d'exploration ni de recherche web au-delà de la demande ; poser une question courte plutôt que d'explorer plusieurs pistes.
- Pas de sous-agent sauf demande explicite.

## Présentation

Yawasla Corpus est une application de lecture du Coran verset par verset, avec traduction officielle multilingue et un système d'apprentissage du vocabulaire au survol : passer la souris sur un mot arabe affiche sa traduction mot-à-mot avec son analyse grammaticale (ex : « lire (v.) 3e pers. pluriel », « livre (nom commun) sing. »).

Projet distinct de `org` (Yawasla newsroom open-source) et `com` (Yawasla plateforme commerciale), au sein du même espace de travail Yawasla.

## ⚠️ Statut du projet : construction très progressive

Ne pas anticiper ou développer de fonctionnalités hors du périmètre défini ci-dessous sans demande explicite. Le périmètre s'enrichira au fur et à mesure.

## Concept

### Accueil
- Liste des 114 sourates du Coran avec traduction officielle.
- Une sourate pas encore disponible est affichée **grisée** (non cliquable).
- Ordre de développement : on **commence par la sourate 114 et on remonte** vers la 1.
- Possibilité de changer de langue + détection de la langue du visiteur.
- Lien vers la bibliothèque des compagnons.

### Page sourate
- Texte arabe affiché **verset par verset**.
- Traduction officielle affichée en regard (source à confirmer : Hamidullah ou Complexe du Roi Fahd — voir « Sources de données »).
- **Multilingue dès le départ** : français, anglais, espagnol.

### Survol d'un mot (fonctionnalité clé)
- Au survol d'un mot arabe, une infobulle affiche :
  - sa traduction,
  - son analyse grammaticale (nature, personne, nombre, genre, etc.).

### Bibliothèque des Compagnons
- Une page liste tous les Compagnons présents dans les recueils retenus (une centaine, un peu plus si la matière le permet : au moins 3 faits pertinents sur le Compagnon), avec une page dédiée par Compagnon.
- Chaque page décrit la personnalité du Compagnon : une courte synthèse, puis les hadiths cités, limités à quatre recueils : Sahih al-Bukhari, Al-Muwatta, Riyad as-Salihin et Bulugh al-Maram.
- Synthèse (`resume`) : 2-3 phrases sur les qualités montrées par les traits de la page, sans biographie ni lien externe (faisable pour tous les Compagnons).
- On n'analyse pas le contenu juridique d'un hadith, mais ce qu'il révèle des qualités du Compagnon.
- Aucune hiérarchie entre Compagnons : pas de trait fondé sur un mérite comparé ou une préférence (« le meilleur », « meilleur que X », « nul ne l'égale »), y compris une préférence du Prophète pour un Compagnon (« si je devais prendre un khalil », « celui qui m'a le plus soutenu », « le plus aimé »), ce n'est pas le but du corpus.
- Chaque trait mentionné dans la synthèse s'appuie sur un hadith cité sur la page.
- Chaque hadith est affiché avec son texte arabe, sa référence et son degré d'authenticité.
- Relecture entrée par entrée : une entrée validée reçoit `"valide": true` dans `compagnon_NNN.ts` et n'est plus jamais modifiée par `fiche` ni `traduction`.
- Hadith écarté : ajouté à `exclus` (réf + raison), jamais repris par `fiche`.
- Relecture : vérifier sur l'arabe le rapporteur, qui parle et les coupures ; « Allah », « shaytan », guillemets « … “…” … ». Le fait décrit le geste du Compagnon ; les qualités (par nous, plusieurs par fait) sont des qualités, pas des états, lues sur tout le hadith. Préférer la version à chaîne complète d'un *balagh*.
- Pas de très longs hadiths (texte arabe ≤ 2 000 caractères, `MAX_CARACTERES` dans `scripts/fiche.mjs`) : sinon le trait est retiré (un doublon peut illustrer un autre fait).
- Répartition des recueils sur une page, si possible : Bukhari ≤ 30 %, Al-Muwatta ≤ 25 %, Riyad as-Salihin ≤ 25 %, Bulugh al-Maram ≤ 20 % (`QUOTAS` dans `scripts/fiche.mjs`), jamais de décision juridique comme trait.
- Petit projet : les pages restent courtes, pas d'étude détaillée : au plus 20 traits (30 pour les quatre califes bien guidés, ids 1–4), au minimum 4 à 5 si possible, 3 si pertinents.
- Texte arabe des hadiths repris des sources open source listées dans « Sources de données », traduction FR/EN/ES réalisée par nos soins et indiquée comme telle sur le site.
- Liste des Compagnons dans `src/data/config.ts` (id = URL `/compagnons/<id>/<slug>`) : premier jet à vérifier contre les recueils, retirés listés dans `RETIRES` (`scripts/compagnons.mjs`, section en fin de `resume.md`), ids renumérotés une fois (1–96, califes 1–4) ; un Compagnon ajouté plus tard prend l'id suivant, un id n'est jamais réutilisé.
- Ordre d'affichage (`compagnonsOrdonnes` dans `config.ts`) : les quatre califes (ids 1–4) en tête, puis par nombre de hadiths cités décroissant, à égalité par ordre alphabétique ; pas de numéro devant le nom, nombre de hadiths entre parenthèses dans la liste et dans le titre de la barre du bas ; flèches précédent/suivant dans cet ordre. L'id (URL) ne suit pas cet ordre et ne change plus une fois figé.

## Exigences non-fonctionnelles

- **Rapidité et simplicité avant tout** : UX minimaliste, temps de chargement/réponse très courts. Toute fonctionnalité ajoutée ne doit pas dégrader ce principe.
- **Mobile first** : le site est adapté en mobile puis tablette et desktop.

## Stack technique

**Next.js (React)**, en génération statique (SSG) pour les pages de sourates : le contenu est pré-généré en HTML à la publication (bon pour le référencement, chargement rapide), et l'interactivité (survol des mots, audio) est ajoutée par-dessus côté client.

Hébergement cible : VPS, le build statique est simplement servi par le serveur web (Apache/Nginx), sans process Node ni base de données nécessaires en production pour ces pages. Toute évolution qui remettrait ce choix en cause doit être validée explicitement.

## Sources de données

Fichiers dans `sources/` (ignoré par git : `coran/`, `hadith/`), contenu affiché **verbatim** (jamais modifié), attribution + lien visibles dans le bouton info (`conf/license.ts`).

**Coran** (Tanzil Project, même indexation sourate/verset partout) : `quran-simple.xml` (arabe), `fr.hamidullah.xml`, `en.ahmedali.xml`, `es.bornez.xml` ; grammaire mot-à-mot : `quranic-corpus-morphology-0.4.txt` (Quranic Arabic Corpus). Découper en mots cliquables n'est pas modifier.
- Traduction mot-à-mot : jamais inventée, reprise du mot de la traduction officielle du verset qui correspond le mieux ; un mot plus fidèle seulement au cas par cas si la traduction est trop libre.

**Hadiths** (`sources/hadith/`) :
- Bukhari, Al-Muwatta : `ara-bukhari.json`, `ara-malik.json` (hadith-api, domaine public, degrés fournis pour Al-Muwatta).
- Riyad as-Salihin, Bulugh al-Maram : `openiti-*` (OpenITI, CC BY-NC-SA 4.0 : non commercial, nos traductions sous la même licence, URI des fichiers dans le README) ; sans diacritiques ni degré (degré repris de la mention en fin de hadith : « رواه مسلم » → Sahih, « حسن صحيح » → Hasan Sahih). Numérotation différente de hadith-json : rapprochement par le texte (`openiti-riyad.mjs`, `openiti-bulugh.mjs`), numéro affiché pour Riyad = OpenITI (numéros fautifs réparés d’après les voisins), pour Bulugh = hadith-json.
- `bukhari.json`, `malik.json`, `riyad_assalihin.json`, `bulugh_almaram.json` (hadith-json, sunnah.com, sans licence) : repérage interne uniquement, jamais affichés.
- Un hadith présent dans plusieurs recueils est cité de préférence depuis Bukhari/Al-Muwatta.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run grammaire -- <n°>` | Grammaire (fr/en/es/ar, forme verbale II–XII) et racine de chaque mot d'une sourate depuis le Quranic Arabic Corpus ; s'arrête sur une étiquette non traduite ou un nombre de mots différent. |
| `npm run audio -- <n°>` | Télécharge un mp3 par verset (EveryAyah) pour chaque récitateur, Bismillah en `00.mp3`. |
| `npm run compagnons` | Repère les hadiths candidats de chaque Compagnon (A/R/B/X) → `analyse/compagnons/`. |
| `npm run filtre -- <id>… \| tous` | Tri Mistral (yes/no/review, trait, épisode, citation vérifiée) → `analyse/mistral/NNN-slug.md`. Clé `MISTRAL_API_KEY` dans `.env.local`, modèle `mistral-medium-latest` (`MODELE=` pour changer). |
| `npm run filtre -- synthese <id>…` | Regroupe les retenus en 50 traits majeurs max, sans hiérarchie entre Compagnons → `NNN-slug-synthese.md`. |
| `npm run fiche -- <id>` | Préremplit `src/data/compagnons/compagnon_NNN.ts` depuis la synthèse : 30 traits max (ids 1–4) ou 20, hadith ≤ 2 000 caractères, texte arabe verbatim, ﷺ ajouté ; garde résumé et traductions existants. |
| `npm run traduction -- <id>` | Traduit avec Mistral les traits (en → fr/es/ar) et les hadiths (arabe → fr/en/es, chaîne réduite au Compagnon) d'une fiche ; ne remplit que les champs vides. |
| `npm run filtre -- test <fichier>` | Compare la consigne à un échantillon validé à la main (calibrage). |

`analyse/` est ignoré par git (extraits sunnah.com non publiables).

## Audio (récitation)

- Deux récitateurs (Al-Hussary, Al-Houdaifi), un mp3 par verset téléchargé depuis EveryAyah par `npm run audio -- <n° sourate>` (`scripts/audio.mjs`), jamais découpé à la main.
- Licence : usage non commercial, enregistrements non modifiés, crédit + lien EveryAyah dans « Sources & remerciements » (`conf/license.ts`).
- Fichiers : `public/assets/audio/<recitateur>/<id>-<slug>/<verset>.mp3` (ex. `al-hussary/001-al-fatiha/01.mp3`).
- Un récitateur est disponible pour une sourate dès que ses versets ont une clé `audio` pour lui, même vide (déduit dans `conf/audio.ts`, pas de liste à maintenir) ; sinon son option est désactivée dans `SelecteurRecitateur`.
- Choix du récitateur mémorisé en local (`RecitateurProvider`), partagé entre lecture de la sourate entière et bouton par verset.
- Bismillah = verset `numero: 0` dans `sourate_NNN.ts` (copie du verset 1 d'Al-Fatiha, audio dupliqué en `00.mp3`), absente d'At-Tawbah/9 ; jamais numérotée (`NumeroVerset`).
- Surlignage mot-à-mot (`Verset.audio`, un timestamp par mot) **abandonné pour l'instant** : `[]` écrit par le script, le lecteur gère encore les minutages s'ils reviennent.
- Pendant la lecture, chaque nouveau verset remonte en haut de l'écran, sauf si une infobulle est ouverte.

## Évolutions

Tout ce qui n'est pas listé dans « Concept » ci-dessus à ne pas développer sans demande explicite. Exemple d'évolutions possibles :

- Ajout d'autres traductions.
- Recherche plein texte.
- API Corpus des pages des Compagnons.
- Recueil Sahih Muslim, seulement si une page manque de matière : Riyad as-Salihin et Bulugh al-Maram en citent déjà une sélection (gain surtout sur le livre Fada'il as-Sahaba).
- Rubrique Prophètes cités dans le Coran (25) : versets repérés par lemme `PN` du Quranic Arabic Corpus, même tri que pour les Compagnons sur ce qu'un passage révèle du Prophète.

---

## TODO

- [x] Définir le format de stockage de la source (texte, traductions FR/EN/ES, mot-à-mot)
- [x] Page d'accueil : liste des 114 sourates (dispo / grisées)
- [x] Page sourate : affichage verset par verset + traduction
- [x] Interaction au survol : infobulle traduction + grammaire par mot
- [x] Sélecteur de langue (FR / EN / ES)
- [x] Darkmode
- [x] Attribution Tanzil + Quranic Arabic Corpus visible sur le site (obligation de licence)
- [x] Sélecteur de récitateur (options désactivées tant qu'une sourate n'est pas découpée pour ce récitateur)
- [x] Sommaire de la page des Compagnons
- [ ] Intégration du contenu Coran
- [ ] Intégration du contenu Compagnon

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
