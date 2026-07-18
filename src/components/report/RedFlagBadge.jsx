export default function RedFlagBadge({ flag }) {
  return (
    <span
      className={`badge cursor-help capitalize ${
        flag.id === "lowball" ? "badge-error" : "badge-warning"
      }`}
      title={flag.message}
    >
      {flag.id.replace(/_/g, " ")}
    </span>
  );
}
