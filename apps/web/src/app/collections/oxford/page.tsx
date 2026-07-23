import { redirect } from "next/navigation";
import { getOxfordPath } from "@/features/collections/oxford/lib/oxfordNavigation";

export default function OxfordCollectionsIndexPage() {
  redirect(getOxfordPath("A1"));
}
