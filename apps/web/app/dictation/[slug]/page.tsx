import { DictationSlugPage } from "@/_pages/dictation";

type DictationSlugRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: DictationSlugRouteProps) {
  const { slug } = await params;

  return <DictationSlugPage slug={slug} />;
}
