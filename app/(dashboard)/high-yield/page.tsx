import type { Metadata } from "next";
import HighYieldClient from "./HighYieldClient";

export const metadata: Metadata = { title: "High Yield Topics" };

export default function HighYieldPage() {
  return <HighYieldClient />;
}
