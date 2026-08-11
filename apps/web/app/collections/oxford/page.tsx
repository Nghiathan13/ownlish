import { redirect } from "next/navigation";
import { getOxfordPath } from "@/entities/collection";

export default function OxfordCollectionsIndexPage() {
  redirect(getOxfordPath("A1"));
}
