"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sourates, compagnons as listeCompagnons, compagnonsOrdonnes, nbHadiths, padId, titreSourate, getVersets } from "@/data/config";
import { langueDePathname, urlPourLangue } from "@/conf/locale";
import { LIBELLES } from "@/conf/libelles";
import { aAudio } from "@/conf/audio";
import { useTheme } from "@/components/ThemeProvider";
import { useTransliteration } from "@/components/TransliterationProvider";
import { useRecitateur } from "@/components/RecitateurProvider";
import MenuLangue from "@/components/MenuLangue";
import MenuInfo from "@/components/MenuInfo";
import LecteurAudio from "@/components/LecteurAudio";

// Barre fixe en bas sur toutes les pages : sommaire/langue, sourate en cours, navigation précédent/suivant.
export default function BarreNavigation() {
  const pathname = usePathname();
  const langue = langueDePathname(pathname);
  const libelles = LIBELLES[langue];
  // Rubrique Compagnons : sommaire vers la liste des Compagnons, pas de translittération (propre au texte coranique).
  const compagnons = /^(?:\/(?:en|es|ar))?\/compagnons(?:\/|$)/.test(pathname);
  const { theme, basculerTheme } = useTheme();

  // Le layout racine ne connaît pas le segment [locale] au rendu serveur : on corrige lang/dir sur <html> ici une fois la langue connue via l'URL.
  useEffect(() => {
    document.documentElement.lang = langue;
    document.documentElement.dir = langue === "ar" ? "rtl" : "ltr";
  }, [langue]);

  const { afficher: afficherTransliteration, basculer: basculerTransliteration } = useTransliteration();
  const { recitateur } = useRecitateur();

  const disponibles = sourates.filter((s) => s.disponible);
  const idActuel = Number(pathname.match(/^(?:\/(?:en|es|ar))?\/sourate\/(\d+)\//)?.[1]);
  const indexActuel = disponibles.findIndex((s) => s.id === idActuel);
  const sourateActuelle = indexActuel >= 0 ? disponibles[indexActuel] : null;
  // Page d'un Compagnon : son nom dans la barre, sans numéro (pas de classement entre Compagnons).
  const idCompagnon = Number(pathname.match(/^(?:\/(?:en|es|ar))?\/compagnons\/(\d+)\//)?.[1]);
  const compagnonActuel = listeCompagnons.find((c) => c.id === idCompagnon) ?? null;
  const dossierAudio = sourateActuelle ? `${padId(sourateActuelle.id)}-${sourateActuelle.slug}` : null;
  const versetsActuels = sourateActuelle ? getVersets(sourateActuelle.id) : [];
  // Précédent/suivant parmi les pages disponibles de la rubrique en cours (sourates, ou Compagnons dans l'ordre d'affichage).
  const rubrique = compagnons ? compagnonsOrdonnes().filter((c) => c.disponible) : disponibles;
  const indexRubrique = compagnons ? rubrique.findIndex((c) => c.id === idCompagnon) : indexActuel;
  const precedente = indexRubrique > 0 ? rubrique[indexRubrique - 1] : null;
  const suivante = indexRubrique >= 0 && indexRubrique < rubrique.length - 1 ? rubrique[indexRubrique + 1] : null;
  const libellePrecedent = compagnons ? libelles.compagnonPrecedent : libelles.souratePrecedente;
  const libelleSuivant = compagnons ? libelles.compagnonSuivant : libelles.sourateSuivante;

  function urlPage(page: { id: number; slug: string }): string {
    return urlPourLangue(`/${compagnons ? "compagnons" : "sourate"}/${padId(page.id)}/${page.slug}`, langue);
  }

  return (
    <nav className="barre-navigation">
      <div className="barre-navigation__groupe">
        <Link
          href={urlPourLangue(compagnons ? "/compagnons" : "/", langue)}
          className="barre-navigation__bouton"
          title={libelles.sommaire}
          aria-label={libelles.sommaire}
        >
          <i className="bi bi-list-ul" aria-hidden="true" />
        </Link>
        <MenuLangue />
        <button
          type="button"
          onClick={basculerTheme}
          className="barre-navigation__bouton"
          title={theme === "sombre" ? libelles.modeClair : libelles.modeSombre}
          aria-label={theme === "sombre" ? libelles.modeClair : libelles.modeSombre}
        >
          <i className={`bi ${theme === "sombre" ? "bi-sun" : "bi-moon"}`} aria-hidden="true" />
        </button>
        <MenuInfo langue={langue} />
      </div>

      <div className="barre-navigation__titre d-none d-sm-block">
        {sourateActuelle ? (
          <>
            <span className="text-muted me-2">{sourateActuelle.id}.</span>
            {titreSourate(sourateActuelle, langue)}
          </>
        ) : compagnonActuel ? (
          <>
            {langue === "ar" ? compagnonActuel.nom.arabe : compagnonActuel.nom.transliteration}
            <span className="text-muted ms-2">({nbHadiths(compagnonActuel)})</span>
          </>
        ) : null}
      </div>

      <div className="barre-navigation__groupe">
        {!compagnons && (
          <label className="barre-navigation__switch" title={libelles.translitteration}>
            <i className="bi bi-type" aria-hidden="true" />
            <span className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={afficherTransliteration}
                onChange={basculerTransliteration}
                aria-label={libelles.translitteration}
              />
            </span>
          </label>
        )}
        {dossierAudio && aAudio(recitateur, versetsActuels) && (
          <LecteurAudio dossier={dossierAudio} versets={versetsActuels} langue={langue} />
        )}
        {precedente ? (
          <Link
            href={urlPage(precedente)}
            className="barre-navigation__bouton"
            title={libellePrecedent}
            aria-label={libellePrecedent}
          >
            ←
          </Link>
        ) : (
          <span className="barre-navigation__bouton barre-navigation__bouton--desactive" aria-hidden="true">
            ←
          </span>
        )}
        {suivante ? (
          <Link
            href={urlPage(suivante)}
            className="barre-navigation__bouton"
            title={libelleSuivant}
            aria-label={libelleSuivant}
          >
            →
          </Link>
        ) : (
          <span className="barre-navigation__bouton barre-navigation__bouton--desactive" aria-hidden="true">
            →
          </span>
        )}
      </div>
    </nav>
  );
}
