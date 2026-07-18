export const evaluate = (quote, vertical) => {
  const flags = [];
  const total = quote.total || 0;
  const lines = quote.lines || [];

  for (const rule of vertical.redFlags || []) {
    // Sum across every line with the fee key — two $150 "other" lines are the
    // same smell as one $300 line.
    const feeSum = rule.feeKey
      ? lines.filter((l) => l.feeKey === rule.feeKey).reduce((s, l) => s + (l.amount || 0), 0)
      : 0;

    if (rule.type === "below_market_pct") {
      if (total > 0 && total < vertical.benchmarks.marketMid * (1 - rule.thresholdPct / 100)) {
        flags.push({ id: rule.id, message: rule.message });
      }
    } else if (rule.type === "missing_term") {
      if (rule.term === "guaranteed" && !quote.guaranteed) {
        flags.push({ id: rule.id, message: rule.message });
      }
    } else if (rule.type === "fee_over_pct") {
      if (feeSum > 0 && total > 0 && feeSum > (rule.thresholdPct / 100) * total) {
        flags.push({ id: rule.id, message: rule.message });
      }
    } else if (rule.type === "fee_present") {
      if (feeSum >= rule.minAmount) {
        flags.push({ id: rule.id, message: rule.message });
      }
    }
  }

  return flags;
};

export default { evaluate };
