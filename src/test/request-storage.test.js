import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { handleEventRequest, handleLeadRequest } from "../lib/qualifi-request-storage.server";
import { PAGES } from "../lib/qualifi-pages";

function request(body) {
  return new Request("https://qualifilab.com/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("requests without a configured persistent store", () => {
  it("never returns a saved lead or invented reference for a valid submission", async () => {
    const response = await handleLeadRequest(request({ email: "test@example.invalid", consent: true }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "storage_not_configured" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each([
    null,
    { email: "invalid", consent: true },
    { email: "test@example.invalid", consent: false },
    { email: "test@example.invalid", consent: "yes" },
    { email: "test@example.invalid", consent: true, website: "bot" },
  ])("rejects invalid submissions before the storage check: %j", async body => {
    const response = await handleLeadRequest(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_submission" });
  });

  it("handles malformed JSON without reporting success", async () => {
    const response = await handleLeadRequest(new Request("https://qualifilab.com/api/leads", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
  });

  it("does not acknowledge an analytics event that was not stored", async () => {
    const response = handleEventRequest();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "storage_not_configured" });
  });
});

describe("campaign form storage failure", () => {
  it.each([
    ["tr", "/tr/gmail-satis-takibi"],
    ["en", "/en/gmail-sales-follow-up"],
  ])("retains the entered email and shows an honest %s error", async (_locale, route) => {
    const html = PAGES[route];
    expect(html).toBeTruthy();
    const dom = new JSDOM(html, { url: `https://qualifilab.com${route}`, runScripts: "outside-only" });
    const win = dom.window;
    try {
      Object.defineProperty(win.crypto, "randomUUID", { value: randomUUID });
      win.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
      win.HTMLDialogElement.prototype.close = function () { this.open = false; };
      win.fetch = async () => handleLeadRequest(request({ email: "test@example.invalid", consent: true }));
      win.eval(readFileSync(resolve("public/campaign.js"), "utf8"));
      (win.document.querySelector("#consent-decline")).click();
      (win.document.querySelector(".campaign-primary")).click();
      const email = win.document.querySelector("#campaign-email");
      email.value = "test@example.invalid";
      (win.document.querySelector('[name="consent"]')).checked = true;
      const form = win.document.querySelector("#campaign-form");
      form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 0));
      const error = win.document.querySelector(".form-error");
      expect(error.hidden).toBe(false);
      expect(error.textContent).toContain("talha.guler@ozu.edu.tr");
      expect(email.value).toBe("test@example.invalid");
      expect(form.hidden).toBe(false);
      expect((win.document.querySelector("#campaign-success")).hidden).toBe(true);
      expect((form.querySelector('button[type="submit"]')).disabled).toBe(false);
    } finally {
      win.close();
    }
  });
});
