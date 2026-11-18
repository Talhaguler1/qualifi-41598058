import { describe, expect, it } from "vitest";
import { sourceFromMetadata, touchFromUrl } from "@/lib/attribution";
import { track, trackingEnabled } from "@/lib/tracking";

describe("first-touch attribution", () => {
  it("reads utm tags from an ad link", () => {
    const t = touchFromUrl("https://qualifilab.com/isletmeler?utm_source=Meta&utm_medium=paid&utm_campaign=SME%20Trafik", new Date("2026-11-19T10:00:00Z"))!;
    expect(t).toMatchObject({ source: "meta", medium: "paid", campaign: "SME Trafik", landing: "/isletmeler" });
  });

  it("recognises a Meta click id without utm tags", () => {
    expect(touchFromUrl("https://qualifilab.com/?fbclid=abc123")?.source).toBe("meta");
  });

  it("ignores ordinary visits and unsafe values", () => {
    expect(touchFromUrl("https://qualifilab.com/demo")).toBeNull();
    expect(touchFromUrl("https://qualifilab.com/?utm_source=<script>")).toBeNull();
  });

  it("copies only safe, display-only fields from sign-up metadata", () => {
    expect(sourceFromMetadata({ source: "meta", campaign: "SME Trafik", role: "admin" })).toEqual({ qualifi_source: "meta", qualifi_campaign: "SME Trafik" });
    expect(sourceFromMetadata({ source: "<x>" })).toEqual({});
    expect(sourceFromMetadata(undefined)).toEqual({});
  });

  it("never sends an event before the visitor consents", () => {
    expect(trackingEnabled()).toBe(true);
    track("Lead");
    expect((globalThis as { fbq?: unknown }).fbq).toBeUndefined();
  });
});
