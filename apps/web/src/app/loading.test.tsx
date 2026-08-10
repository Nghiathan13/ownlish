import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/collections/detail/page/components/CollectionDetailPageSkeleton", () => ({
  CollectionDetailPageSkeleton: () => <div>Collection detail skeleton</div>,
}));
vi.mock("@/features/collections/list/components/CollectionsPageSkeleton", () => ({
  CollectionsPageSkeleton: () => <div>Collections skeleton</div>,
}));
vi.mock("@/features/review/components/ReviewPageSkeleton", () => ({
  ReviewPageSkeleton: () => <div>Review skeleton</div>,
}));
vi.mock("@/features/tests/overview/components/TestsOverviewPageSkeleton", () => ({
  TestsOverviewPageSkeleton: () => <div>Tests skeleton</div>,
}));
vi.mock("@/features/tests/run/components/TestRunLoadingSkeleton", () => ({
  TestRunLoadingSkeleton: ({ variant }: { variant: string }) => (
    <div>Run skeleton: {variant}</div>
  ),
}));

import CollectionDetailLoading from "./collections/[collectionId]/loading";
import CollectionsLoading from "./collections/loading";
import ReviewLoading from "./review/loading";
import MockTestRunLoading from "./tests/[sessionId]/mock_test/loading";
import PracticeRunLoading from "./tests/[sessionId]/practice/loading";
import ReviewWrongRunLoading from "./tests/[sessionId]/review_wrong/loading";
import PartPracticeRunLoading from "./tests/part-practice/[sessionId]/loading";
import TestsLoading from "./tests/loading";
import UserCollectionDetailLoading from "./collections/user/[collectionId]/loading";

describe("app loading route wrappers", () => {
  it("renders each collection and overview loading skeleton", () => {
    const { rerender } = render(<CollectionsLoading />);
    expect(screen.getByText("Collections skeleton")).toBeInTheDocument();

    rerender(<CollectionDetailLoading />);
    expect(screen.getByText("Collection detail skeleton")).toBeInTheDocument();

    rerender(<UserCollectionDetailLoading />);
    expect(screen.getByText("Collection detail skeleton")).toBeInTheDocument();

    rerender(<ReviewLoading />);
    expect(screen.getByText("Review skeleton")).toBeInTheDocument();

    rerender(<TestsLoading />);
    expect(screen.getByText("Tests skeleton")).toBeInTheDocument();
  });

  it("selects the expected loading variant for every test session route", () => {
    const { rerender } = render(<MockTestRunLoading />);
    expect(screen.getByText("Run skeleton: mock_test")).toBeInTheDocument();

    rerender(<PracticeRunLoading />);
    expect(screen.getByText("Run skeleton: practice")).toBeInTheDocument();

    rerender(<ReviewWrongRunLoading />);
    expect(screen.getByText("Run skeleton: review_wrong")).toBeInTheDocument();

    rerender(<PartPracticeRunLoading />);
    expect(screen.getByText("Run skeleton: part_practice")).toBeInTheDocument();
  });
});
