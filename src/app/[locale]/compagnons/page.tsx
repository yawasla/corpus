import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageCompagnons from "@/components/PageCompagnons";
import { alternatesPour } from "@/conf/locale";
import { LIBELLES } from "@/conf/libelles";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }, { locale: "ar" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "es" && locale !== "ar") return {};
  return {
    title: `${LIBELLES[locale].compagnons} — Yawasla Corpus`,
    alternates: alternatesPour("/compagnons", locale),
  };
}

export default async function CompagnonsLocale({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "es" && locale !== "ar") notFound();
  return <PageCompagnons langue={locale} />;
}
