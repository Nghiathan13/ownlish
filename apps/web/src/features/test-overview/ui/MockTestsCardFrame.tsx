import type { ReactNode } from "react";
import { CardFrame } from "@/shared/ui/card-frame";

type MockTestsCardFrameProps = {
  children: ReactNode;
};

export function MockTestsCardFrame({ children }: MockTestsCardFrameProps) {
  return <CardFrame>{children}</CardFrame>;
}
