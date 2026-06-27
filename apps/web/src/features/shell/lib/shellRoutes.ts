import { isImmersiveTestPath } from "@/features/tests/shared/lib/isImmersiveTestPath";

export type ShellLayoutMode = "bare" | "immersive" | "default";

function isAdminToeicDetailPath(pathname: string) {
  return /^\/admin\/toeic\/\d+$/.test(pathname);
}

export function getShellLayoutMode(pathname: string): ShellLayoutMode {
  if (pathname === "/login") {
    return "bare";
  }

  if (isImmersiveTestPath(pathname) || isAdminToeicDetailPath(pathname)) {
    return "immersive";
  }

  return "default";
}
