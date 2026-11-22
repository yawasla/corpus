import Link from "next/link";
import { padId, type Compagnon } from "@/data/config";
import type { Langue } from "@/conf/types";
import { urlPourLangue } from "@/conf/locale";

export default function ListeCompagnons({ compagnons, langue }: { compagnons: Compagnon[]; langue: Langue }) {
  const nom = (c: Compagnon) => (langue === "ar" ? c.nom.arabe : c.nom.transliteration);
  return (
    <ul className="list-unstyled sommaire-liste">
      {compagnons.map((compagnon) =>
        compagnon.disponible ? (
          <li key={compagnon.id} className="mb-2">
            <Link href={urlPourLangue(`/compagnons/${padId(compagnon.id)}/${compagnon.slug}`, langue)} className="sourate-lien text-decoration-none">
              <span className="text-muted me-2">{compagnon.id}.</span>
              {nom(compagnon)}
            </Link>
          </li>
        ) : (
          <li key={compagnon.id} className="mb-2 sourate-indisponible">
            <span aria-disabled="true">
              <span className="me-2">{compagnon.id}.</span>
              {nom(compagnon)}
            </span>
          </li>
        )
      )}
    </ul>
  );
}
