import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText, type ModelMessage } from "ai";
import * as XLSX from "xlsx";
import { createLovableAiGatewayRunIdFetch } from "@/lib/ai/run-id.server";
import {
  EXTRACT_INSTRUCTIONS, extractionSchema, type ExtractInput, type ExtractStore, type Extractor, type CommitmentRow,
} from "@/lib/workspace-extract.server";

export const EXTRACT_MODEL = "openai/gpt-6-astra";

export function spreadsheetToText(bytes: Uint8Array): string {
  const wb = XLSX.read(bytes, { type: "array" });
  return wb.SheetNames.map((n) => `## Sayfa: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n]!)}`).join("\n\n");
}

export function createExtractor(apiKey: string, signal?: AbortSignal): Extractor {
  return async (input: ExtractInput) => {
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    const intro = `Dosya adı: ${input.name}\nDosya türü: ${input.kind}\nBu belgedeki taahhütleri çıkar.`;
    const content: Extract<ModelMessage, { role: "user" }>["content"] =
      input.type === "text"
        ? [{ type: "text", text: `${intro}\n\n--- BELGE ---\n${input.text}` }]
        : input.type === "image"
          ? [{ type: "text", text: intro }, { type: "image", image: `data:${input.mediaType};base64,${input.base64}` }]
          : [{ type: "text", text: intro }, { type: "file", filename: input.name, data: input.base64, mediaType: "application/pdf" }];
    let failure: unknown;
    const result = streamText({
      model: provider.responses(EXTRACT_MODEL),
      instructions: EXTRACT_INSTRUCTIONS,
      messages: [{ role: "user", content }],
      output: Output.object({ schema: extractionSchema }),
      maxRetries: 0,
      ...(signal ? { abortSignal: signal } : {}),
      onError: ({ error }) => { failure = error; },
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
      },
    });
    try {
      const out = await result.output;
      return out.commitments;
    } catch (e) {
      throw failure ?? e;
    }
  };
}

export async function createExtractStore(): Promise<ExtractStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    async userIdFromToken(token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async getOwnFile(fileId, userId) {
      const { data, error } = await supabaseAdmin.from("qualifi_workspace_files")
        .select("id,user_id,kind,storage_path,original_name,status").eq("id", fileId).eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data as never;
    },
    async setStatus(fileId, status, message) {
      const { error } = await supabaseAdmin.from("qualifi_workspace_files").update({ status, error: message }).eq("id", fileId);
      if (error) throw error;
    },
    async download(path) {
      const { data, error } = await supabaseAdmin.storage.from("workspace-files").download(path);
      if (error || !data) throw error ?? new Error("missing");
      return new Uint8Array(await data.arrayBuffer());
    },
    async replaceCommitments(fileId, userId, rows: CommitmentRow[]) {
      const del = await supabaseAdmin.from("qualifi_commitments").delete().eq("file_id", fileId).eq("user_id", userId);
      if (del.error) throw del.error;
      if (rows.length) {
        const ins = await supabaseAdmin.from("qualifi_commitments").insert(rows);
        if (ins.error) throw ins.error;
      }
    },
  };
}
