// Document intake — photo or PDF of an inventory list / estimate → Anthropic
// vision extraction into the same draft spec the voice interview fills.

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

export default function DocUpload({ jobId, vertical, onSpecUpdate }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      try {
        const fileBase64 = String(reader.result).split(",")[1];
        const res = await fetch("/api/jobs/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vertical: vertical.id,
            jobId,
            fileBase64,
            mediaType: file.type || "application/pdf",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed");
        const count = Object.keys(data.job?.spec || {}).length;
        toast.success(`Spec now has ${count} field${count === 1 ? "" : "s"} after reading ${file.name}`);
        onSpecUpdate();
      } catch (err) {
        toast.error(err.message);
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    };
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsDataURL(file);
  };

  return (
    <section className="card p-5">
      <h2 className="font-semibold">Upload a document</h2>
      <p className="text-sm text-muted-foreground">
        A photo of your inventory list or an old estimate works — we pull the details into the same spec.
      </p>
      <label
        className={`mt-4 flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary-400 hover:text-foreground ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {busy ? (
          <>
            <Loader label="Extracting" />
            <span>Reading your document…</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>Click to choose an image or PDF</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
    </section>
  );
}
