import type { Metadata } from "next";
import { compagnons, padId } from "@/data/config";
import PageCompagnon from "@/components/PageCompagnon";
import { alternatesPour } from "@/conf/locale";

export function generateStaticParams() {
  return compagnons.filter((c) => c.disponible).map((c) => ({ id: padId(c.id), name: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; name: string }> }): Promise<Metadata> {
  const { id, name } = await params;
  const compagnon = compagnons.find((c) => c.id === Number(id) && c.slug === name);
  return {
    title: compagnon ? `${compagnon.nom.transliteration} — Yawasla Corpus` : undefined,
    alternates: alternatesPour(`/compagnons/${id}/${name}`, "fr"),
  };
}

export default async function CompagnonPage({ params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params;
  return <PageCompagnon id={id} name={name} langue="fr" />;
}
