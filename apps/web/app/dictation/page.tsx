import {
  DEFAULT_DICTATION_CATEGORY_ID,
  getDictationCategoryPath,
} from "@/entities/dictation-library";
import { redirect } from "next/navigation";

export default function DictationPage() {
  redirect(getDictationCategoryPath(DEFAULT_DICTATION_CATEGORY_ID));
}
