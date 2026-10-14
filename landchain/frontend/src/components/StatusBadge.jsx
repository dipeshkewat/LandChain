/**
 * Status badge component for chain_status and transfer status.
 * Uses consistent colors per spec: Pending, Confirmed, Failed, Needs reconciliation.
 */
export default function StatusBadge({ status }) {
  const statusMap = {
    pending: { label: "Pending", className: "badge-pending" },
    confirmed: { label: "Confirmed", className: "badge-confirmed" },
    failed: { label: "Failed", className: "badge-failed" },
    needs_reconciliation: { label: "Needs Reconciliation", className: "badge-warning" },
  };

  const config = statusMap[status] || { label: status, className: "badge-default" };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
