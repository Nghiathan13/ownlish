import { PracticeSessionRoutePage } from "@/_pages/tests";

type ReviewWrongPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function ReviewWrongPage({ params }: ReviewWrongPageProps) {
  return <PracticeSessionRoutePage mode="review_wrong" params={params} />;
}
