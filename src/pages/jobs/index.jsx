import { useEffect, useState } from "react";
import Link from "next/link";
import { getVertical } from "@/config/verticals";
import { CutButton } from "@/components/ui/CutButton";
import Loader from "@/components/ui/Loader";

const STATUS_BADGE = {
  draft: "badge-info",
  confirmed: "badge-info",
  calling: "badge-warning",
  negotiating: "badge-warning",
  done: "badge-success",
};

// First two string values in taxonomy order, e.g. "Rock Hill, SC → Charlotte, NC".
function specLine(job) {
  const vertical = getVertical(job.vertical);
  const vals = (vertical?.jobSpec?.fields || [])
    .map((f) => job.spec?.[f.key])
    .filter((v) => typeof v === "string" && v);
  return vals.slice(0, 2).join(" → ");
}

export default function JobsPage() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setJobs(data.jobs || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-foreground">Jobs</h1>
        <CutButton href="/jobs/new">New Job</CutButton>
      </div>

      {error && <p className="text-sm text-error-500">{error}</p>}
      {!jobs && !error && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}
      {jobs && jobs.length === 0 && (
        <div className="card p-8 text-center text-sm text-muted-foreground">
          No jobs yet. Start one and let the agents make the calls.
        </div>
      )}

      <div className="space-y-3">
        {(jobs || []).map((job) => {
          const vertical = getVertical(job.vertical);
          const href = job.status === "done" ? `/jobs/${job._id}/report` : `/jobs/${job._id}`;
          return (
            <Link
              key={job._id}
              href={href}
              className="card block p-4 transition-colors hover:border-primary-400"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-semibold text-foreground">
                  {vertical?.label || job.vertical}
                </span>
                <span className={`badge ${STATUS_BADGE[job.status] || "badge-info"}`}>
                  {job.status}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
              {specLine(job) && (
                <p className="mt-1 text-sm text-muted-foreground">{specLine(job)}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
