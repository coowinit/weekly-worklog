(function (root) {
  "use strict";

  // Sunday-start calendar, compatible with CLDR week data:
  // firstDay=sun, minDays=1. Week 1 contains January 1.
  const DAY_MS = 86400000;
  const WEEK_MS = DAY_MS * 7;

  function parseDate(value) {
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
        throw new RangeError("Invalid calendar date: " + value);
      }
      return date;
    }
    throw new TypeError("Expected a Date or YYYY-MM-DD string");
  }

  function dateKey(date) {
    const d = parseDate(date);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  }

  function utcDayNumber(date) {
    const d = parseDate(date);
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
  }

  function firstWeekStart(year) {
    const jan1 = new Date(year, 0, 1);
    jan1.setDate(jan1.getDate() - jan1.getDay());
    return jan1;
  }

  function weekStart(date) {
    const d = parseDate(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function weekYear(date) {
    const d = parseDate(date);
    const start = weekStart(d);
    const y = d.getFullYear();
    if (utcDayNumber(start) < utcDayNumber(firstWeekStart(y))) return y - 1;
    if (utcDayNumber(start) >= utcDayNumber(firstWeekStart(y + 1))) return y + 1;
    return y;
  }

  function weekNumber(date) {
    const d = parseDate(date);
    const y = weekYear(d);
    return Math.floor((utcDayNumber(weekStart(d)) - utcDayNumber(firstWeekStart(y))) / 7) + 1;
  }

  function weeksInYear(year) {
    return Math.round((utcDayNumber(firstWeekStart(year + 1)) - utcDayNumber(firstWeekStart(year))) / 7);
  }

  function getWeekStart(year, week) {
    if (!Number.isInteger(year) || year < 1 || year > 9998) throw new RangeError("Year out of range");
    if (!Number.isInteger(week) || week < 1 || week > weeksInYear(year)) throw new RangeError("Week out of range");
    const start = firstWeekStart(year);
    start.setDate(start.getDate() + (week - 1) * 7);
    return start;
  }

  function datesInWeek(year, week) {
    const start = getWeekStart(year, week);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function getWeek(date) {
    const d = parseDate(date);
    return { year: weekYear(d), week: weekNumber(d), start: weekStart(d) };
  }

  function addWeeks(year, week, amount) {
    if (!Number.isInteger(amount)) throw new TypeError("Week offset must be an integer");
    const d = getWeekStart(year, week);
    d.setDate(d.getDate() + amount * 7);
    return getWeek(d);
  }

  const returnExport = {
    parseDate, dateKey, firstWeekStart, weekStart, weekYear, weekNumber,
    weeksInYear, getWeekStart, datesInWeek, getWeek, addWeeks
  };
  root.WorklogCalendar = returnExport;
  if (typeof module !== "undefined" && module.exports) module.exports = returnExport;
})(typeof globalThis !== "undefined" ? globalThis : this);
