import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DictionaryLookupBoundary } from "@/features/dictionary-lookup";
import { LocaleProvider, QueryProvider } from "@/shared/lib/providers";
import { mswServer } from "@/shared/lib/testing";

const dictionaryRoot = vi.hoisted(() => ({ value: "https://content.example/dictionary" }));

vi.mock("@/shared/config", () => ({
  get DICTIONARY_ROOT() {
    return dictionaryRoot.value;
  },
}));

const entry = {
  word: "a",
  etymologies: [
    {
      etymology: "From Latin a.",
      phonetics: { us: { ipa: "/eɪ/", audio: "en-us-a.ogg" } },
      homophones: [],
      parts_of_speech: [
        {
          part_of_speech: "Article",
          definitions: [
            {
              definition_en: "An indefinite article.",
              definition_vi: "Một mạo từ không xác định.",
              meaning: "một",
              labels: [],
              synonyms: [],
              antonyms: [],
              examples: [],
              sub_definitions: [],
            },
          ],
        },
      ],
    },
  ],
};

function LookupHarness({ onAnswer = vi.fn() }: { onAnswer?: () => void }) {
  return (
    <QueryProvider>
      <LocaleProvider>
        <DictionaryLookupBoundary>
          <div data-testid="lookup-root">
            <button onClick={onAnswer} type="button">
              <span data-testid="dictionary-word">A</span>
            </button>
            <span data-testid="missing-word">b</span>
            <span data-testid="punctuated-word">a.</span>
          </div>
        </DictionaryLookupBoundary>
      </LocaleProvider>
    </QueryProvider>
  );
}

function setSelectionRange(range: Range) {
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function selectText(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  setSelectionRange(range);
  fireEvent.pointerUp(element);
}

function clearSelection() {
  window.getSelection()?.removeAllRanges();
  document.dispatchEvent(new Event("selectionchange"));
}

describe("DictionaryLookupBoundary", () => {
  beforeEach(() => {
    clearSelection();
    dictionaryRoot.value = "https://content.example/dictionary";
    Object.assign(Range.prototype, {
      getBoundingClientRect: () => new DOMRect(16, 16, 20, 20),
      getClientRects: () => [new DOMRect(16, 16, 20, 20)],
    });
  });

  it("shows a skeleton then the entry and caches a repeated selection", async () => {
    let requestCount = 0;
    mswServer.use(
      http.get("https://content.example/dictionary/a.json", () => {
        requestCount += 1;
        return HttpResponse.json(entry);
      }),
    );
    render(<LookupHarness />);

    selectText(screen.getByTestId("dictionary-word"));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("An indefinite article.")).toBeInTheDocument();
    const popup = screen.getByRole("dialog", { name: "Dictionary" });
    expect(popup).not.toHaveClass("min-w-[min(200px,calc(100vw-1rem))]");
    expect(popup).toHaveClass("w-[min(360px,calc(100vw-2rem))]");
    const scrollViewport = popup.querySelector<HTMLDivElement>(".overlay-scroll-hide");
    expect(scrollViewport).toBeInTheDocument();

    Object.defineProperties(scrollViewport!, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
    });
    scrollViewport!.scrollTop = 40;
    fireEvent.scroll(scrollViewport!);

    const scrollRoot = scrollViewport!.parentElement!;
    expect(scrollRoot).toHaveClass("flex", "flex-1", "flex-col");
    expect(scrollRoot.parentElement).toBe(popup);
    fireEvent.mouseEnter(scrollRoot);
    await waitFor(() => {
      expect(scrollRoot.querySelector("[aria-hidden]")).toHaveClass("opacity-100");
    });

    clearSelection();
    selectText(screen.getByTestId("dictionary-word"));
    await screen.findByRole("dialog", { name: "Dictionary" });
    expect(requestCount).toBe(1);
  });

  it("keeps a cached not-found popup open without offering retry", async () => {
    let requestCount = 0;
    mswServer.use(
      http.get("https://content.example/dictionary/b.json", () => {
        requestCount += 1;
        return new HttpResponse(null, { status: 404 });
      }),
    );
    render(<LookupHarness />);

    selectText(screen.getByTestId("missing-word"));

    await waitFor(() => {
      expect(requestCount).toBe(1);
    });

    expect(await screen.findByText("We couldn't find “b” in the dictionary.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();

    clearSelection();
    selectText(screen.getByTestId("missing-word"));
    expect(await screen.findByText("We couldn't find “b” in the dictionary.")).toBeInTheDocument();
    expect(requestCount).toBe(1);
  });

  it("does not start a lookup for a selection outside the boundary", () => {
    render(
      <>
        <span data-testid="outside-word">A</span>
        <LookupHarness />
      </>,
    );

    selectText(screen.getByTestId("outside-word"));

    expect(screen.queryByRole("dialog", { name: "Dictionary" })).not.toBeInTheDocument();
  });

  it("handles keyboard selections and closes for invalid or cross-boundary selections", async () => {
    mswServer.use(
      http.get("https://content.example/dictionary/a.json", () => HttpResponse.json(entry)),
    );
    render(
      <>
        <span data-testid="outside-word">outside</span>
        <LookupHarness />
      </>,
    );
    const word = screen.getByTestId("dictionary-word");

    const keyboardRange = document.createRange();
    keyboardRange.selectNodeContents(word);
    setSelectionRange(keyboardRange);
    fireEvent.keyUp(word, { key: "ArrowRight" });
    expect(await screen.findByRole("dialog", { name: "Dictionary" })).toBeInTheDocument();

    selectText(screen.getByTestId("punctuated-word"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Dictionary" })).not.toBeInTheDocument();
    });

    const crossBoundaryRange = document.createRange();
    crossBoundaryRange.setStart(word.firstChild!, 0);
    crossBoundaryRange.setEnd(screen.getByTestId("outside-word").firstChild!, 7);
    setSelectionRange(crossBoundaryRange);
    fireEvent.pointerUp(word);

    expect(screen.queryByRole("dialog", { name: "Dictionary" })).not.toBeInTheDocument();
  });

  it("does not open when the dictionary root is not configured", () => {
    dictionaryRoot.value = "";
    render(<LookupHarness />);

    selectText(screen.getByTestId("dictionary-word"));

    expect(screen.queryByRole("dialog", { name: "Dictionary" })).not.toBeInTheDocument();
  });

  it("shows a retryable error for a failed request", async () => {
    let requestCount = 0;
    mswServer.use(
      http.get("https://content.example/dictionary/a.json", () => {
        requestCount += 1;
        return requestCount === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(entry);
      }),
    );
    render(<LookupHarness />);
    const user = userEvent.setup();

    selectText(screen.getByTestId("dictionary-word"));
    fireEvent.click(screen.getByTestId("dictionary-word"));
    expect(
      await screen.findByText("We couldn't load this definition right now. Please try again."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("An indefinite article.")).toBeInTheDocument();
    expect(requestCount).toBe(2);
  });

  it("suppresses an answer click after selecting option text but preserves a normal click", () => {
    const onAnswer = vi.fn();
    render(<LookupHarness onAnswer={onAnswer} />);
    const word = screen.getByTestId("dictionary-word");

    selectText(word);
    fireEvent.click(word);
    expect(onAnswer).not.toHaveBeenCalled();

    clearSelection();
    fireEvent.pointerDown(word);
    fireEvent.pointerUp(word);
    fireEvent.click(word);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape is pressed or the user presses outside the popup", async () => {
    mswServer.use(
      http.get("https://content.example/dictionary/a.json", () => HttpResponse.json(entry)),
    );
    render(<LookupHarness />);

    selectText(screen.getByTestId("dictionary-word"));
    expect(await screen.findByRole("dialog", { name: "Dictionary" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Dictionary" })).not.toBeInTheDocument();
    });

    selectText(screen.getByTestId("dictionary-word"));
    expect(await screen.findByRole("dialog", { name: "Dictionary" })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Dictionary" })).not.toBeInTheDocument();
    });
  });
});
