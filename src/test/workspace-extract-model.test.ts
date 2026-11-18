import { describe, expect, it } from "vitest";
import { pickExtractModel } from "@/lib/workspace-extract-deps.server";

describe("extract model choice", () => {
  it("images use the vision model with medium effort", () => {
    expect(pickExtractModel("image")).toEqual({ model: "openai/gpt-6-luna", effort: "medium" });
  });
  it("text and pdf use the text model with low effort", () => {
    expect(pickExtractModel("text")).toEqual({ model: "openai/gpt-6-luna", effort: "low" });
    expect(pickExtractModel("pdf" as never).model).toBe("openai/gpt-6-luna");
  });
  it("never uses astra", () => {
    for (const t of ["image", "text", "pdf"]) expect(pickExtractModel(t as never).model).not.toContain("astra");
  });
});
