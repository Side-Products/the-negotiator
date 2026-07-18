import RedFlagBadge from "@/components/report/RedFlagBadge";

const fmt = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

export default function RankingTable({ ranking, quotes, calls, recommendedQuoteId, onSelect }) {
  const rows = [...(ranking || [])]
    .sort((a, b) => a.rank - b.rank)
    .map((r) => {
      const quote = quotes.find((q) => q._id === r.quoteId);
      const call = quote && calls.find((c) => c._id === quote.callId);
      return { ...r, quote, call };
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2.5 pr-4 font-medium">Rank</th>
            <th className="py-2.5 pr-4 font-medium">Vendor</th>
            <th className="py-2.5 pr-4 text-right font-medium">Landed total</th>
            <th className="py-2.5 pr-4 font-medium">Guaranteed</th>
            <th className="py-2.5 pr-4 font-medium">Fees</th>
            <th className="py-2.5 font-medium">Red flags</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const recommended = String(row.quoteId) === String(recommendedQuoteId);
            return (
              <tr
                key={row.quoteId}
                onClick={onSelect && row.call ? () => onSelect(row.call._id) : undefined}
                className={`border-b border-border/60 last:border-0 ${
                  onSelect ? "cursor-pointer hover:bg-muted/50" : ""
                } ${recommended ? "bg-primary-400/10" : ""}`}
              >
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      recommended ? "bg-primary-400 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.rank}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {row.call?.vendorName || "Unknown vendor"}
                    {recommended && <span className="badge badge-success">Recommended</span>}
                    {row.call?.round === 2 && <span className="badge badge-info">Round 2</span>}
                  </div>
                  {row.riskNote && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{row.riskNote}</div>
                  )}
                </td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                  {fmt(row.landedTotal ?? row.quote?.total)}
                </td>
                <td className="py-3 pr-4">
                  <span className={`badge ${row.quote?.guaranteed ? "badge-success" : "badge-warning"}`}>
                    {row.quote?.guaranteed ? "Yes" : "No"}
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                  {row.quote?.lines?.length ?? 0}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(row.quote?.redFlags || []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">None</span>
                    ) : (
                      row.quote.redFlags.map((flag) => <RedFlagBadge key={flag.id} flag={flag} />)
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
