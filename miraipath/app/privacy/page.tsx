import type { Metadata } from "next";
import PrivacyClient from "@/components/shared/PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy & Your Data",
  description:
    "Private by default. How MiraiPath handles student data, consent-based introductions, and your delete/export controls.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
