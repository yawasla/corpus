import type { Langue } from "@/conf/types";
import { LIBELLES } from "@/conf/libelles";
import { compagnonsOrdonnes } from "@/data/config";
import CadreOrnemental from "@/components/CadreOrnemental";
import EnTete from "@/components/EnTete";
import ListeCompagnons from "@/components/ListeCompagnons";

export default function PageCompagnons({ langue }: { langue: Langue }) {
  const libelles = LIBELLES[langue];
  return (
    <main className="page-shell pt-2 pb-5 text-center">
      <h1 className="visually-hidden">{libelles.compagnons}</h1>
      <EnTete langue={langue} actif="compagnons" />
      <CadreOrnemental>
        <ListeCompagnons compagnons={compagnonsOrdonnes()} langue={langue} />
      </CadreOrnemental>
    </main>
  );
}
