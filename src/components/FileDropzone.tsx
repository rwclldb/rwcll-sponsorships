"use client";

import { useEffect, useRef, useState } from "react";

const MB = 1024 * 1024;

/**
 * A file input styled as a drop area: drag a file onto it or click to browse. The real <input>
 * covers the whole area (invisibly), so dropping, clicking, keyboard use and form submission all
 * work the normal way, even before JavaScript loads.
 */
export function FileDropzone({
  name,
  id,
  accept,
  required,
  maxBytes = 4 * MB,
  prompt = "Drag a file here, or click to choose one",
}: {
  name: string;
  id?: string;
  accept?: string;
  required?: boolean;
  maxBytes?: number;
  prompt?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Image thumbnail: one object URL at a time, freed when replaced or unmounted.
  const previewRef = useRef<string | null>(null);
  function choose(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next && next.type.startsWith("image/") ? URL.createObjectURL(next) : null;
    setPreview(previewRef.current);
    setFile(next);
  }
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  // Forms reset after a successful submit; clear the chosen file with them.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      choose(null);
      setError(null);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  function onChange() {
    const input = inputRef.current;
    const chosen = input?.files?.[0] ?? null;
    setDragging(false);
    if (chosen && chosen.size > maxBytes) {
      setError(`That file is ${(chosen.size / MB).toFixed(1)} MB. Please choose one under ${Math.round(maxBytes / MB)} MB.`);
      if (input) input.value = "";
      choose(null);
      return;
    }
    setError(null);
    choose(chosen);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    choose(null);
    setError(null);
  }

  return (
    <div>
      <div
        className={`relative flex min-h-24 items-center gap-4 rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
          dragging
            ? "border-brand bg-brand/10"
            : file
              ? "border-brand/60 bg-brand/5"
              : "border-line bg-white hover:border-brand/60"
        } focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/30`}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          onChange={onChange}
          onDragEnter={() => setDragging(true)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            // Take the dropped file ourselves so every browser behaves the same.
            e.preventDefault();
            const dropped = e.dataTransfer.files;
            if (dropped.length && inputRef.current) {
              const dt = new DataTransfer();
              dt.items.add(dropped[0]);
              inputRef.current.files = dt.files;
            }
            onChange();
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-16 w-24 shrink-0 rounded border border-line bg-white object-contain" />
        ) : (
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper text-2xl text-muted">
            ⇪
          </span>
        )}
        <div className="min-w-0 flex-1 text-sm">
          {file ? (
            <>
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-muted">
                {file.size < MB ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / MB).toFixed(1)} MB`} ·
                drop or click to choose a different file
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">{dragging ? "Drop it here" : prompt}</p>
              <p className="text-muted">Up to {Math.round(maxBytes / MB)} MB</p>
            </>
          )}
        </div>
        {file && (
          // Sits above the invisible input so it can be clicked.
          <button type="button" onClick={clear} className="relative z-10 rounded px-2 py-1 text-sm text-muted hover:bg-paper">
            Remove
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
