import { ToeicRunPage } from "@/features/tests/components/ToeicRunPage";

type ReviewWrongPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export default function ReviewWrongPage({ params }: ReviewWrongPageProps) {
  return <ToeicRunPage mode="review_wrong" params={params} />;
}
