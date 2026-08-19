import type { ReactNode } from "react";
import { CardFrame } from "@/shared/ui/card-frame";

type PartPracticeCardFrameProps = {
  children: ReactNode;
};

export function PartPracticeCardFrame({ children }: PartPracticeCardFrameProps) {
  return <CardFrame>{children}</CardFrame>;
}
