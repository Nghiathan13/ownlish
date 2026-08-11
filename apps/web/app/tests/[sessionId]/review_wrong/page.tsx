import { ToeicSessionRoutePage } from "@/_pages/tests";

type ReviewWrongPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default function ReviewWrongPage({ params }: ReviewWrongPageProps) {
  return <ToeicSessionRoutePage mode="review_wrong" params={params} />;
}
