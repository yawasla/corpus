import { sourates } from "@/data/config";
import type { Langue } from "@/conf/types";
import ListeSourates from "@/components/ListeSourates";
import CadreOrnemental from "@/components/CadreOrnemental";
import EnTete from "@/components/EnTete";

export default function PageAccueil({ langue }: { langue: Langue }) {
  return (
    <main className="page-shell pt-2 pb-5 text-center">
      <h1 className="visually-hidden">Yawasla Corpus</h1>
      <EnTete langue={langue} actif="coran" />
      <CadreOrnemental>
        <ListeSourates sourates={sourates} langue={langue} />
      </CadreOrnemental>
    </main>
  );
}
