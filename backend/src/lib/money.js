import Decimal from "decimal.js-light";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function parseMoney(value) {
  if (value === null || value === undefined || value === "") return new Decimal(0);
  return new Decimal(String(value));
}

export function money(value) {
  return parseMoney(value).toFixed(2);
}

export function minMoney(a, b) {
  const left = parseMoney(a);
  const right = parseMoney(b);
  return left.lt(right) ? left : right;
}

export function maxMoney(a, b) {
  const left = parseMoney(a);
  const right = parseMoney(b);
  return left.gt(right) ? left : right;
}

export function sumMoney(values) {
  return values.reduce((sum, value) => sum.plus(parseMoney(value)), new Decimal(0));
}
