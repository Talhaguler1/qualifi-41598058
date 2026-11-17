// Small, honest cash outlook for an empty account built only from what the user uploaded.
// No payment history yet, so it uses due dates; items needing review or already overdue
// are left out of the cautious line.

import { addDays, diffDays } from "./demo/dates";

export interface WorkspaceCommitment {
  id: string;
  counterparty: string;
  direction: string; // "in" | "out"
  amount: number;
  due_date: string | null;
  kind: string;
  status: string; // "open" | "paid"
  needs_review: boolean;
}

export interface WorkspaceWeek {
  weekStart: string;
  inflow: number;
  inflowSure: number;
  outflow: number;
  balance: number;
  balanceCautious: number;
}

export interface WorkspaceOutlook {
  weeks: WorkspaceWeek[];
  undated: WorkspaceCommitment[];
  overdue: WorkspaceCommitment[];
  openIn: number;
  openOut: number;
}

export function workspaceOutlook(items: WorkspaceCommitment[], startBalance: number, asOf: string, weeks = 8): WorkspaceOutlook {
  const open = items.filter((c) => c.status !== "paid");
  const undated = open.filter((c) => !c.due_date);
  const dated = open.filter((c) => c.due_date);
  const overdue = dated.filter((c) => c.direction === "in" && (c.due_date as string) < asOf);
  // An overdue receivable is assumed to arrive a week from today in the base line.
  const when = (c: WorkspaceCommitment) => (c.direction === "in" && (c.due_date as string) < asOf ? addDays(asOf, 7) : (c.due_date as string));
  const start = addDays(asOf, 1);
  const result: WorkspaceWeek[] = [];
  let balance = startBalance;
  let cautious = startBalance;
  for (let w = 0; w < weeks; w++) {
    const from = addDays(start, w * 7);
    const to = addDays(from, 7);
    const inWeek = dated.filter((c) => {
      const d = when(c);
      return d >= from && d < to;
    });
    const inflowItems = inWeek.filter((c) => c.direction === "in");
    const inflow = inflowItems.reduce((s, c) => s + c.amount, 0);
    const inflowSure = inflowItems.filter((c) => !c.needs_review && !overdue.includes(c)).reduce((s, c) => s + c.amount, 0);
    const outflow = inWeek.filter((c) => c.direction === "out").reduce((s, c) => s + c.amount, 0);
    balance += inflow - outflow;
    cautious += inflowSure - outflow;
    result.push({ weekStart: from, inflow, inflowSure, outflow, balance, balanceCautious: cautious });
  }
  return {
    weeks: result,
    undated,
    overdue,
    openIn: open.filter((c) => c.direction === "in").reduce((s, c) => s + c.amount, 0),
    openOut: open.filter((c) => c.direction === "out").reduce((s, c) => s + c.amount, 0),
  };
}

export function daysLate(dueDate: string, asOf: string): number {
  return diffDays(asOf, dueDate);
}

export const KIND_BY_EXTENSION: Record<string, "contract" | "invoice_image" | "spreadsheet" | "whatsapp"> = {
  pdf: "contract",
  png: "invoice_image",
  jpg: "invoice_image",
  jpeg: "invoice_image",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  txt: "whatsapp",
};

export const FILE_KIND_LABEL = { contract: "Sözleşme", invoice_image: "Fatura görseli", spreadsheet: "Excel / CSV", whatsapp: "WhatsApp sohbeti" } as const;
