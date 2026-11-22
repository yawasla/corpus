import Link from "next/link";
import { padId, nbHadiths, type Compagnon } from "@/data/config";
import type { Langue } from "@/conf/types";
import { urlPourLangue } from "@/conf/locale";

// Pas de numéro devant le nom (pas de classement) ; nombre de hadiths entre parenthèses pour les pages disponibles.
export default function ListeCompagnons({ compagnons, langue }: { compagnons: Compagnon[]; langue: Langue }) {
  const nom = (c: Compagnon) => (langue === "ar" ? c.nom.arabe : c.nom.transliteration);
  return (
    <ul className="list-unstyled sommaire-liste">
      {compagnons.map((compagnon) =>
        compagnon.disponible ? (
          <li key={compagnon.id} className="mb-2">
            <Link href={urlPourLangue(`/compagnons/${padId(compagnon.id)}/${compagnon.slug}`, langue)} className="sourate-lien text-decoration-none">
              {nom(compagnon)}
              <span className="text-muted ms-2">({nbHadiths(compagnon)})</span>
            </Link>
          </li>
        ) : (
          <li key={compagnon.id} className="mb-2 sourate-indisponible">
            <span aria-disabled="true">
              {nom(compagnon)}
            </span>
          </li>
        )
      )}
    </ul>
  );
}
