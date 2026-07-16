import type { Metadata } from "next";
import ConsultClient from "@/components/forms/ConsultClient";

export const metadata: Metadata = {
  title: "Consult an Advisor Directly",
  description:
    "Enter your details and request a direct online consultation to find universities and vocational schools in Japan. Your data is recorded so an advisor can prepare tailored guidance. Demo version.",
};

export default function ConsultPage() {
  return <ConsultClient />;
}
