import { APP_NAV_LINKS } from "@/features/shell/lib/appNavLinks";
import { classNames } from "@/shared/lib/classNames";
import { Skeleton } from "@/shared/ui/Skeleton";

type ShellNavSkeletonProps = {
  collapsed?: boolean;
  variant?: "sidebar" | "mobile";
};

export function ShellNavSkeleton({
  collapsed = false,
  variant = "sidebar",
}: ShellNavSkeletonProps) {
  if (variant === "mobile") {
    return (
      <div className="order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap sm:order-none sm:w-auto sm:gap-6 sm:overflow-visible">
        {APP_NAV_LINKS.map((link) => (
          <Skeleton className="h-4 w-20" key={link.href} />
        ))}
      </div>
    );
  }

  return (
    <nav
      aria-hidden
      className={classNames(
        "flex flex-col gap-1",
        collapsed && "items-center",
      )}
    >
      {APP_NAV_LINKS.map((link) => (
        <div
          className={classNames(
            "flex items-center rounded-lg px-2 py-2",
            collapsed ? "justify-center" : "gap-2",
          )}
          key={link.href}
        >
          <Skeleton className="size-6 shrink-0 rounded-md" />
          {!collapsed ? <Skeleton className="h-4 w-24" /> : null}
        </div>
      ))}
    </nav>
  );
}
