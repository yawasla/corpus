import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo_yawasla.webp";
import type { Langue } from "@/conf/types";
import { LIBELLES } from "@/conf/libelles";
import { urlPourLangue } from "@/conf/locale";

type Rubrique = "coran" | "compagnons";

// En-tête des pages d'accueil : logo + liens vers les deux rubriques, celle en cours mise en avant.
export default function EnTete({ langue, actif }: { langue: Langue; actif: Rubrique }) {
  const libelles = LIBELLES[langue];
  const liens: { rubrique: Rubrique; chemin: string }[] = [
    { rubrique: "coran", chemin: "/" },
    { rubrique: "compagnons", chemin: "/compagnons" },
  ];

  return (
    <header className="en-tete mb-4">
      <Image src={logo} alt="Yawasla" className="en-tete__logo" priority />
      <nav className="en-tete__liens">
        {liens.map(({ rubrique, chemin }) => (
          <Link
            key={rubrique}
            href={urlPourLangue(chemin, langue)}
            className={`en-tete__lien${rubrique === actif ? " en-tete__lien--actif" : ""}`}
            aria-current={rubrique === actif ? "page" : undefined}
          >
            {libelles[rubrique]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
