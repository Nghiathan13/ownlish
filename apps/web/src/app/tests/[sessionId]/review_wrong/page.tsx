import { ToeicSessionPage } from "@/features/tests/run/components/ToeicSessionPage";

type ReviewWrongPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function ReviewWrongPage({ params }: ReviewWrongPageProps) {
  return <ToeicSessionPage mode="review_wrong" params={params} />;
}
