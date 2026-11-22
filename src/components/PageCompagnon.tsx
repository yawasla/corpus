import { notFound } from "next/navigation";
import { compagnons, getFiche } from "@/data/config";
import type { Langue } from "@/conf/types";
import { LIBELLES } from "@/conf/libelles";
import SeparateurOrnemental from "@/components/SeparateurOrnemental";

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PageCompagnon({ id, name, langue }: { id: string; name: string; langue: Langue }) {
  const compagnon = compagnons.find((c) => c.id === Number(id) && c.slug === name && c.disponible);

  if (!compagnon) {
    notFound();
  }

  const libelles = LIBELLES[langue];
  const fiche = getFiche(compagnon.id);

  return (
    <main className="page-shell page-shell--lecture py-5" lang={langue}>
      <h1 className="titre-accueil text-center mb-4" dir="rtl" lang="ar">
        {compagnon.nom.arabe}
      </h1>
      {/* En arabe le h1 ci-dessus porte déjà le nom : rien à ajouter en dessous. */}
      {langue !== "ar" && <h2 className="h5 text-center mb-4">{compagnon.nom.transliteration}</h2>}
      <SeparateurOrnemental />
      {!fiche ? (
        <p className="text-muted text-center my-4">{libelles.bientot}</p>
      ) : (
        <>
          <p className="compagnon-resume">
            {fiche.resume[langue]}{" "}
            <a href={fiche.wikipedia[langue]} target="_blank" rel="noopener noreferrer">
              {libelles.lireWikipedia}
            </a>
          </p>
          <ol className="compagnon-traits">
            {fiche.traits.map(({ trait, hadith }) => (
              <li key={`${hadith.recueil}-${hadith.numero}`} className="compagnon-trait">
                {/* Fait rédigé en anglais par la synthèse : repli sur l'anglais tant que la traduction manque. */}
                <h3 className="h6 compagnon-trait__titre">{majuscule(trait[langue] || trait.en)}</h3>
                {trait.qualites && (
                  <div className="compagnon-trait__qualites">
                    {trait.qualites.map((q) => (
                      <span key={q.en} className="badge rounded-pill compagnon-trait__qualite">
                        {q[langue]}
                      </span>
                    ))}
                  </div>
                )}
                <p className="compagnon-trait__arabe" dir="rtl" lang="ar">
                  {hadith.arabe}
                </p>
                {langue !== "ar" && hadith.traduction?.[langue] && <p className="compagnon-trait__traduction">{hadith.traduction[langue]}</p>}
                <p className="compagnon-trait__ref text-muted">
                  {hadith.recueil} {hadith.numero}
                  {hadith.degre && ` — ${hadith.degre}`}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
