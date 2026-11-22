import type { Metadata } from "next";
import PageCompagnons from "@/components/PageCompagnons";
import { alternatesPour } from "@/conf/locale";

export const metadata: Metadata = {
  title: "Les Compagnons — Yawasla Corpus",
  alternates: alternatesPour("/compagnons", "fr"),
};

export default function Compagnons() {
  return <PageCompagnons langue="fr" />;
}
