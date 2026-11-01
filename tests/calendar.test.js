const assert = require("node:assert/strict");
const Calendar = require("../assets/js/calendar.js");

const cases = [
  ["2025-12-27", 2025, 52],
  ["2025-12-28", 2026, 1],
  ["2025-12-31", 2026, 1],
  ["2026-01-01", 2026, 1],
  ["2026-01-03", 2026, 1],
  ["2026-01-04", 2026, 2],
  ["2026-12-26", 2026, 52],
  ["2026-12-27", 2027, 1],
  ["2027-01-01", 2027, 1],
  ["2027-01-02", 2027, 1],
  ["2027-01-03", 2027, 2],
  ["2028-01-01", 2028, 1],
  ["2028-01-02", 2028, 2]
];

for (const [date, year, week] of cases) {
  const actual = Calendar.getWeek(date);
  assert.equal(actual.year, year, `${date} week-year`);
  assert.equal(actual.week, week, `${date} week-number`);
}

assert.equal(Calendar.weeksInYear(2025), 52);
assert.equal(Calendar.weeksInYear(2026), 52);
assert.equal(Calendar.weeksInYear(2027), 52);
assert.equal(Calendar.weeksInYear(2028), 53);

for (let year = 1900; year <= 2100; year++) {
  const count = Calendar.weeksInYear(year);
  assert.ok(count === 52 || count === 53, `${year} has ${count} weeks`);
  const first = Calendar.datesInWeek(year, 1);
  assert.equal(first[0].getDay(), 0, `${year} week 1 starts Sunday`);
  assert.equal(first[6].getDay(), 6, `${year} week 1 ends Saturday`);
  assert.equal(Calendar.getWeek(first[0]).year, year);
  assert.equal(Calendar.getWeek(first[0]).week, 1);
  const last = Calendar.datesInWeek(year, count);
  assert.equal(last[0].getDay(), 0);
  assert.equal(last[6].getDay(), 6);
  assert.equal(Calendar.getWeek(last[6]).year, year);
  assert.equal(Calendar.getWeek(last[6]).week, count);
}

const next = Calendar.addWeeks(2025, 52, 1);
assert.deepEqual({ year: next.year, week: next.week }, { year: 2026, week: 1 });
const prev = Calendar.addWeeks(2026, 1, -1);
assert.deepEqual({ year: prev.year, week: prev.week }, { year: 2025, week: 52 });

assert.throws(() => Calendar.getWeekStart(2026, 53), RangeError);
assert.throws(() => Calendar.parseDate("2026-02-30"), RangeError);

console.log("Calendar tests passed: boundary dates, 1900–2100 year lengths, week navigation, invalid inputs.");
