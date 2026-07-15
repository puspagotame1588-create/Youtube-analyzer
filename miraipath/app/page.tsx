import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "MiraiPath Japan | Compare Universities and Vocational Schools",
  description:
    "Your future in Japan has more than one path. Compare verified program requirements, costs and career routes — and connect with universities and vocational schools when you are ready. Pilot / demo version.",
};

export default function HomePage() {
  return <HomeClient />;
}
