import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoPrograms, getProgram, getInstitution } from "@/data/programs";
import ProgramDetailClient from "@/components/results/ProgramDetailClient";

export function generateStaticParams() {
  return demoPrograms.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = getProgram(id);
  if (!program) return { title: "Program not found" };
  const institution = getInstitution(program.institutionId);
  return {
    title: `${program.name} — ${institution?.name ?? ""}`,
    description: `${program.summary} Demo listing with fictional data.`,
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = getProgram(id);
  if (!program) notFound();
  return <ProgramDetailClient programId={id} />;
}
