import type { Metadata } from "next";
import ProgressClient from "./ProgressClient";

export const metadata: Metadata = { title: "My Progress" };

export default function ProgressPage() {
  return <ProgressClient />;
}
