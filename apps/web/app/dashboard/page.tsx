import { redirect } from "next/navigation";
import { DASHBOARD_MY_ACTIVITY_PATH } from "@/shared/routes";

export default function DashboardIndexPage() {
  redirect(DASHBOARD_MY_ACTIVITY_PATH);
}
