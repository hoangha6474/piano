import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
const sections = [
  "assessment",
  "curriculum",
  "lessons",
  "practice",
  "library",
  "my-scores",
  "ear-training",
  "technique",
  "progress",
  "schedule",
  "tutor",
  "settings",
];
export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}
export default async function Section({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return (
    <Suspense
      fallback={<div className="boot">Đang mở không gian âm nhạc…</div>}
    >
      <Workspace section={section} />
    </Suspense>
  );
}
