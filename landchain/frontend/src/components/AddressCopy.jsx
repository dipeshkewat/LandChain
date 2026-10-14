import { useState } from "react";

/**
 * Truncated address/hash display with clean text copy action.
 * No icons or emojis.
 */
export default function AddressCopy({ value, chars = 6 }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-muted">—</span>;

  const truncated =
    value.length > chars * 2 + 2
      ? `${value.slice(0, chars + 2)}…${value.slice(-chars)}`
      : value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="address-copy" title={value}>
      <code className="address-text">{truncated}</code>
      <button
        type="button"
        className={`copy-btn ${copied ? "copied" : ""}`}
        onClick={handleCopy}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
