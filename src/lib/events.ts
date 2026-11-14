import { Linking, Platform } from "react-native";

import type { ChoirEvent, LanguageCode } from "@/lib/types";

/** Month names written out, as on the website's event pages. */
const months: Record<LanguageCode, string[]> = {
  rw: ["Mutarama", "Gashyantare", "Werurwe", "Mata", "Gicurasi", "Kamena", "Nyakanga", "Kanama", "Nzeri", "Ukwakira", "Ugushyingo", "Ukuboza"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};

const allDay: Record<LanguageCode, string> = { rw: "Umunsi wose", en: "All day", fr: "Toute la journée" };
const everyDay: Record<LanguageCode, string> = { rw: "Buri munsi", en: "Every day", fr: "Chaque jour" };

/** Rwanda keeps UTC+2 all year, so Kigali's date is a fixed two hours on from UTC. */
export function kigaliToday(now = new Date()): string {
  return new Date(now.getTime() + 2 * 3_600_000).toISOString().slice(0, 10);
}

/**
 * The website sends only gatherings not over yet, but a copy saved on the
 * phone can be days old — so the date is checked again here.
 */
export function upcomingEvents(events: ChoirEvent[] | undefined, now = new Date()): ChoirEvent[] {
  const today = kigaliToday(now);
  return (events ?? []).filter((event) => event.end >= today);
}

/** True while the gathering is on: today falls between its first and last day. */
export function isHappening(event: ChoirEvent, now = new Date()): boolean {
  const today = kigaliToday(now);
  return event.start <= today && today <= event.end;
}

/** "19 December 2026" — or "19 Ukuboza 2026". */
export function formatDay(date: string, language: LanguageCode, withYear = true): string {
  const day = Number(date.slice(8, 10));
  const month = months[language][Number(date.slice(5, 7)) - 1];
  return withYear ? `${day} ${month} ${date.slice(0, 4)}` : `${day} ${month}`;
}

/** One day, or "19 – 20 December 2026", across months and years as needed. */
export function formatRange(event: Pick<ChoirEvent, "start" | "end">, language: LanguageCode): string {
  if (event.start === event.end) return formatDay(event.start, language);
  const sameYear = event.start.slice(0, 4) === event.end.slice(0, 4);
  const sameMonth = sameYear && event.start.slice(5, 7) === event.end.slice(5, 7);
  if (sameMonth) return `${Number(event.start.slice(8, 10))} – ${formatDay(event.end, language)}`;
  return `${formatDay(event.start, language, !sameYear)} – ${formatDay(event.end, language)}`;
}

/** "10:00 – 14:00", "Every day, 10:00 – 14:00", or "All day". */
export function formatTime(event: ChoirEvent, language: LanguageCode): string {
  if (!event.startTime) return allDay[language];
  const hours = event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime;
  return event.start !== event.end ? `${everyDay[language]}, ${hours}` : hours;
}

/** Short month names for the date badge, as the app writes dates elsewhere. */
const shortMonths: Record<LanguageCode, string[]> = {
  rw: ["Mut", "Gas", "Wer", "Mata", "Gic", "Kam", "Nya", "Kan", "Nze", "Ukw", "Ugu", "Uku"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};

/** The day and month for a date badge: ["19", "Uku"]. */
export function dateBadge(date: string, language: LanguageCode): [string, string] {
  return [String(Number(date.slice(8, 10))), shortMonths[language][Number(date.slice(5, 7)) - 1]];
}

/**
 * Puts the gathering in the phone's calendar, the way the website's buttons do:
 * an iPhone opens the calendar file with webcal://, which hands it straight to
 * the Calendar app; Android and the browser open Google Calendar filled in.
 */
export async function addToCalendar(event: ChoirEvent, language: LanguageCode): Promise<void> {
  if (Platform.OS === "ios") {
    const file = `${event.calendarFileUrl}?lang=${language}`;
    const webcal = file.replace(/^https?:\/\//, "webcal://");
    try {
      await Linking.openURL(webcal);
      return;
    } catch {
      await Linking.openURL(file);
      return;
    }
  }
  const google = event.googleCalendarUrl[language] || event.googleCalendarUrl.rw || event.googleCalendarUrl.en;
  if (Platform.OS === "web") {
    window.open(google, "_blank", "noopener");
    return;
  }
  await Linking.openURL(google);
}
