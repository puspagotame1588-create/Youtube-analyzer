import type { Metadata } from "next";
import PassportClient from "@/components/passport/PassportClient";

export const metadata: Metadata = {
  title: "Future Passport",
  description:
    "Create a shareable Future Passport card of your best current route in Japan — you control what is shown. Demo version.",
};

export default function PassportPage() {
  return <PassportClient />;
}
