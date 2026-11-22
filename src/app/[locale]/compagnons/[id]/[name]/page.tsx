import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compagnons, padId } from "@/data/config";
import PageCompagnon from "@/components/PageCompagnon";
import { alternatesPour } from "@/conf/locale";

export function generateStaticParams() {
  const disponibles = compagnons.filter((c) => c.disponible).map((c) => ({ id: padId(c.id), name: c.slug }));
  return ["en", "es", "ar"].flatMap((locale) => disponibles.map((c) => ({ locale, ...c })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; name: string }>;
}): Promise<Metadata> {
  const { locale, id, name } = await params;
  if (locale !== "en" && locale !== "es" && locale !== "ar") return {};
  const compagnon = compagnons.find((c) => c.id === Number(id) && c.slug === name);
  const titre = compagnon ? (locale === "ar" ? compagnon.nom.arabe : compagnon.nom.transliteration) : undefined;
  return {
    title: titre ? `${titre} — Yawasla Corpus` : undefined,
    alternates: alternatesPour(`/compagnons/${id}/${name}`, locale),
  };
}

export default async function CompagnonPageLocale({
  params,
}: {
  params: Promise<{ locale: string; id: string; name: string }>;
}) {
  const { locale, id, name } = await params;
  if (locale !== "en" && locale !== "es" && locale !== "ar") notFound();
  return <PageCompagnon id={id} name={name} langue={locale} />;
}
