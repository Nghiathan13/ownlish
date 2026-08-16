"use client";

import { useState } from "react";
import { AccountIcon } from "@/shared/ui/icons";

export function LeaderboardAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!avatarUrl || failed) {
    return (
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted-background text-muted-foreground">
        <AccountIcon className="size-5" />
      </span>
    );
  }

  return (
    // Avatar URLs can be from Google or R2 and do not use Next image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className="size-9 shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
      src={avatarUrl}
    />
  );
}
