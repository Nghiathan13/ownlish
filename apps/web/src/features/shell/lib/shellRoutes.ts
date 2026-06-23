import { isImmersiveTestPath } from "@/features/tests/shared/lib/isImmersiveTestPath";

export type ShellLayoutMode = "bare" | "immersive-test" | "default";

export function getShellLayoutMode(pathname: string): ShellLayoutMode {
  if (pathname === "/login") {
    return "bare";
  }

  if (isImmersiveTestPath(pathname)) {
    return "immersive-test";
  }

  return "default";
}
