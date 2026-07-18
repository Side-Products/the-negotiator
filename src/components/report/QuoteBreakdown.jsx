const fmt = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

export default function QuoteBreakdown({ quote, vertical }) {
  const feeLabel = (line) =>
    vertical?.fees?.find((f) => f.key === line.feeKey)?.label || line.label || line.feeKey;
  const mid = vertical?.benchmarks?.marketMid;
  const delta = typeof mid === "number" ? quote.total - mid : null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Line item</th>
              <th className="py-2 pr-4 font-medium">Note</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(quote.lines || []).map((line, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2 pr-4 text-foreground">{feeLabel(line)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{line.note || ""}</td>
                <td className="py-2 text-right tabular-nums">{fmt(line.amount)}</td>
              </tr>
            ))}
            <tr className="border-b border-border">
              <td className="py-2.5 pr-4 font-semibold">Total</td>
              <td />
              <td className="py-2.5 text-right font-semibold tabular-nums">{fmt(quote.total)}</td>
            </tr>
            {delta !== null && (
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">Market midpoint</td>
                <td className="py-2 pr-4">
                  <span className={`badge ${delta <= 0 ? "badge-success" : "badge-warning"}`}>
                    {delta <= 0 ? "" : "+"}
                    {fmt(delta)} vs market
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{fmt(mid)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`badge ${quote.guaranteed ? "badge-success" : "badge-warning"}`}>
          {quote.guaranteed ? "Guaranteed total" : "Not guaranteed"}
        </span>
        {quote.validUntil && <span className="badge badge-info">Valid until {quote.validUntil}</span>}
      </div>
    </div>
  );
}
