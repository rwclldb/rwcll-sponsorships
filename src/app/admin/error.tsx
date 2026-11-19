"use client";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="card max-w-lg space-y-3">
      <h1 className="text-lg font-bold">Something went wrong</h1>
      <p className="text-muted">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "That didn't save. Check what you entered and try again."}
      </p>
      <button className="btn-secondary" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
