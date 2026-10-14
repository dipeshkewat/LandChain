/**
 * Full-page or inline loading spinner.
 */
export default function LoadingSpinner({ message = "Loading…", fullPage = false }) {
  return (
    <div className={`loading-spinner ${fullPage ? "loading-fullpage" : ""}`}>
      <div className="spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}
