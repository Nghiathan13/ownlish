import { describe, expect, it } from "vitest";
import {
  isSignedMediaStillValid,
  mergeSignedMediaState,
} from "@/features/tests/run/hooks/useSignedMedia";

const now = Date.parse("2026-06-26T12:00:00.000Z");

function media(expiresAt: string) {
  return {
    audioUrl: "https://example.com/audio.mp3?token=1",
    audioUrlExpiresAt: expiresAt,
    imageUrl: "https://example.com/image.png?token=1",
    imageUrlExpiresAt: expiresAt,
  };
}

describe("mergeSignedMediaState", () => {
  it("keeps the current media when it is still valid", () => {
    const preferred = media("2026-06-26T12:10:00.000Z");
    const incoming = media("2026-06-26T12:15:00.000Z");

    expect(mergeSignedMediaState(preferred, incoming, now)).toEqual(preferred);
  });

  it("uses incoming media when the current media is near expiry", () => {
    const preferred = media("2026-06-26T12:01:00.000Z");
    const incoming = media("2026-06-26T12:15:00.000Z");

    expect(mergeSignedMediaState(preferred, incoming, now)).toEqual(incoming);
  });
});

describe("isSignedMediaStillValid", () => {
  it("returns true when expiry is beyond the refresh buffer", () => {
    expect(isSignedMediaStillValid(media("2026-06-26T12:10:00.000Z"), now)).toBe(
      true,
    );
  });

  it("returns false when expiry is inside the refresh buffer", () => {
    expect(isSignedMediaStillValid(media("2026-06-26T12:01:00.000Z"), now)).toBe(
      false,
    );
  });
});
