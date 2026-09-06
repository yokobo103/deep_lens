/**
 * Where this reader has been, and when they went.
 *
 * A visit is a gate entered, stamped with the day it happened. Only the first
 * visit is kept: this is a log of places reached, not a counter of how often.
 *
 * It lives in this browser and nowhere else — there is no account to hang it
 * on. That is a real limit and the reason the log is written as a light diary
 * rather than as something to treasure: clearing site data ends it, and nothing
 * should feel lost when a browser is cleaned.
 */

const KEY = "deep-lens-log";

export interface Visit {
  gateId: string;
  /** ISO date, day precision. The day the reader went, not the age they saw. */
  on: string;
}

function today(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function readLog(): Visit[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is Visit =>
      typeof entry === "object" && entry !== null
      && typeof (entry as Visit).gateId === "string"
      && typeof (entry as Visit).on === "string");
  } catch {
    return [];
  }
}

/** Records a first arrival. Returns the log as it now stands. */
export function recordVisit(gateId: string, log: Visit[]): Visit[] {
  if (log.some((visit) => visit.gateId === gateId)) return log;
  const next = [...log, { gateId, on: today() }];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // The log still holds for this visit when storage is unavailable.
  }
  return next;
}

/** `2026-09-06` as the log prints it. */
export function formatDay(iso: string): string {
  return iso.replaceAll("-", ".");
}

/**
 * How long ago, said the way a person says it.
 *
 * Rounded to the nearest million years, because the number under that is not
 * something the record supports and a log is not the place to pretend it is.
 */
export function agePhrase(ma: number, locale: "ja" | "en"): string {
  const million = Math.max(1, Math.round(ma));
  if (locale === "en") return `about ${million.toLocaleString()} million years ago`;
  const man = million * 100;
  const oku = Math.floor(man / 10000);
  const rest = man % 10000;
  if (oku === 0) return `約${man.toLocaleString()}万年前`;
  return rest === 0 ? `約${oku}億年前` : `約${oku}億${rest.toLocaleString()}万年前`;
}

/** The era half of a band label: "ジュラ紀後期 · 約150 Ma" -> "ジュラ紀後期". */
export function eraOf(bandLabel: string): string {
  return bandLabel.split(" · ")[0] ?? bandLabel;
}
