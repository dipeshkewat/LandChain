/**
 * Minimalist error display component without emojis.
 */
export default function ErrorDisplay({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="error-display" role="alert">
      <div className="error-content">
        <p className="error-message">
          {typeof error === "string" ? error : error.message || "An error occurred"}
        </p>
        {error.details && (
          <ul className="error-details">
            {error.details.map((d, i) => (
              <li key={i}>
                <strong>{d.field}:</strong> {d.message}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
