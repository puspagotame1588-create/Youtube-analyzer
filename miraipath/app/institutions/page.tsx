import type { Metadata } from "next";
import InstitutionsClient from "@/components/institution/InstitutionsClient";

export const metadata: Metadata = {
  title: "For Universities and Vocational Schools",
  description:
    "Meet international students who match your actual admission conditions. Consented introductions, structured candidate profiles, demand insights and transparent sponsorship. Pilot program.",
};

export default function InstitutionsPage() {
  return <InstitutionsClient />;
}
