import taxTable from '../data/tax.json';

type RawTaxTable = {
  personal_income_tax_rates: Array<{
    state: string;
    rates:
      | 'none'
      | Array<{
          rate: string; // "4.95%"
          threshold: number;
        }>;
  }>;
};

const table = taxTable as unknown as RawTaxTable;

type Bracket = { threshold: number; rate: number };

function parseRate(rate: string): number {
  const n = Number(rate.replace('%', '').trim());
  return Number.isFinite(n) ? n / 100 : 0;
}

function getBrackets(state: string): Bracket[] | null {
  const entry = table.personal_income_tax_rates.find((x) => x.state === state);
  if (!entry) return null;
  if (entry.rates === 'none') return [];
  const brackets = entry.rates
    .map((r) => ({ threshold: r.threshold, rate: parseRate(r.rate) }))
    .filter((b) => Number.isFinite(b.threshold) && b.threshold >= 0)
    .sort((a, b) => a.threshold - b.threshold);

  if (brackets.length === 0) return [];
  // 有些州表格第一档不是 0（例如从 2000 开始），我们视为 0~首档阈值免税
  if (brackets[0]!.threshold > 0) {
    return [{ threshold: 0, rate: 0 }, ...brackets];
  }
  return brackets;
}

export function getStateMaxMarginalRate(state: string): number {
  const brackets = getBrackets(state);
  if (!brackets) return 0;
  return brackets.reduce((max, b) => Math.max(max, b.rate), 0);
}

export function computeAnnualStateTax(state: string, taxableAnnual: number): number {
  const brackets = getBrackets(state);
  if (!brackets || brackets.length === 0) return 0;
  if (taxableAnnual <= 0) return 0;

  let tax = 0;
  for (let i = 0; i < brackets.length; i += 1) {
    const cur = brackets[i]!;
    const next = brackets[i + 1];
    const upper = next ? next.threshold : taxableAnnual;
    const band = Math.max(0, Math.min(taxableAnnual, upper) - cur.threshold);
    tax += band * cur.rate;
    if (next && taxableAnnual < next.threshold) break;
  }
  return tax;
}

export function computeWeeklyStateTax(state: string, taxableWeekly: number): number {
  // tax.json 阈值口径是年收入；这里把每周税基年化后计算，再还原为每周
  const taxableAnnual = taxableWeekly * 52;
  const annual = computeAnnualStateTax(state, taxableAnnual);
  return annual / 52;
}


