"use client";

import { useEffect, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import type { DemoSession } from "@/lib/demo/seed";
import type { StoredPhoto } from "@/lib/demo/store";
import { ACCEPTED_SOURCE_TYPES } from "@/lib/upload/limits";
import { canEncodeWebp, processImage, validateSourceFile } from "@/lib/upload/process-image";

type Item = {
  id: string;
  file: File;
  state: "idle" | "processing" | "saving" | "done" | "error";
  error: string | null;
};

const STATE_LABEL: Record<Item["state"], string> = {
  idle: "Na fila",
  processing: "Convertendo…",
  saving: "Salvando…",
  done: "Publicada",
  error: "Erro",
};

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "local-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Envio do demo: mesmo processamento do app real (WebP no navegador, sem EXIF),
 * mas em vez de subir para um bucket, guarda as versões web e miniatura no
 * IndexedDB deste navegador.
 */
export function UploadPanel({
  sessions,
  defaultSessionId,
  onSave,
  onClose,
}: {
  sessions: DemoSession[];
  defaultSessionId: string | null;
  onSave: (photo: StoredPhoto) => Promise<void>;
  onClose: () => void;
}) {
  const [sessionId, setSessionId] = useState(defaultSessionId ?? "");
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [webp, setWebp] = useState<"checking" | "ok" | "unsupported">("checking");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const waiting = items.filter((item) => item.state === "idle" || item.state === "error");
  const done = items.filter((item) => item.state === "done").length;
  const canPublish = !busy && webp === "ok" && waiting.length > 0 && sessionId !== "";

  useEffect(() => {
    let alive = true;
    canEncodeWebp().then((ok) => alive && setWebp(ok ? "ok" : "unsupported"));
    return () => {
      alive = false;
    };
  }, []);

  const patch = (id: string, change: Partial<Item>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));

  function addFiles(files: FileList | File[]) {
    const accepted: Item[] = [];
    const refused: string[] = [];
    for (const file of Array.from(files)) {
      const problem = validateSourceFile(file);
      if (problem) refused.push(`${file.name}: ${problem}`);
      else accepted.push({ id: newId(), file, state: "idle", error: null });
    }
    setRejected(refused);
    setItems((current) => [...current, ...accepted]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!busy) addFiles(event.dataTransfer.files);
  }

  async function publish() {
    if (!canPublish) return;
    setBusy(true);
    // Uma por vez: a conversão roda no navegador e pesa em celular.
    for (const item of waiting) {
      patch(item.id, { state: "processing", error: null });
      try {
        const processed = await processImage(item.file);
        patch(item.id, { state: "saving" });
        await onSave({
          id: item.id,
          sessionId,
          createdAt: Date.now(),
          width: processed.width,
          height: processed.height,
          thumb: processed.blobs.thumb,
          web: processed.blobs.web,
        });
        patch(item.id, { state: "done" });
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === "QuotaExceededError"
            ? "Sem espaço no navegador para guardar mais fotos."
            : error instanceof Error
              ? error.message
              : "Falha inesperada.";
        patch(item.id, { state: "error", error: message });
      }
    }
    setBusy(false);
  }

  return (
    <section aria-label="Enviar fotos" className="rounded-[var(--radius-card)] border border-border-hairline bg-surface-card p-[20px] sm:p-[28px]">
      <div className="mb-[20px] flex items-start justify-between gap-[16px]">
        <h2 className="m-0 text-micro font-bold uppercase tracking-[var(--ls-eyebrow)] text-text-muted">Publicar fotos</h2>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
          Fechar
        </Button>
      </div>

      {webp === "unsupported" && (
        <p role="alert" className="mb-[20px] mt-0 rounded-[var(--radius-control)] bg-clay-1 p-[14px] text-body-sm text-clay-5">
          Este navegador não consegue gerar imagens WebP.
        </p>
      )}

      <Select
        label="Sessão"
        name="session"
        value={sessionId}
        onChange={(event) => setSessionId(event.target.value)}
        disabled={busy}
        options={[{ value: "", label: "Escolha a sessão" }, ...sessions.map((s) => ({ value: s.id, label: s.name }))]}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={
          "mt-[24px] flex flex-col items-center gap-[12px] rounded-[var(--radius-card)] border border-dashed px-[20px] py-[32px] text-center transition-[var(--transition-control)] " +
          (dragging ? "border-clay-3 bg-clay-1" : "border-paper-4 bg-surface-sunken")
        }
      >
        <Icon name="upload-cloud" size={28} className="text-ink-4" />
        <p className="m-0 text-body-sm text-text-muted">
          Solte as fotos aqui ou selecione. JPG ou PNG. No demo, elas ficam guardadas só neste navegador.
        </p>
        <label className="cursor-pointer">
          <span className="inline-flex items-center rounded-[var(--radius-control)] px-[14px] py-[9px] text-[11px] font-bold uppercase tracking-[var(--ls-label)] text-text-strong shadow-[inset_0_0_0_2px_var(--border-strong)] hover:bg-ink-1 hover:text-paper-1">
            Selecionar fotos
          </span>
          <input
            type="file"
            multiple
            accept={ACCEPTED_SOURCE_TYPES.join(",")}
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {rejected.length > 0 && (
        <ul role="alert" className="mb-0 mt-[12px] list-none p-0 text-body-sm text-red-3">
          {rejected.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="mb-0 mt-[20px] max-h-[320px] list-none overflow-y-auto rounded-[var(--radius-card)] border border-border-hairline p-0">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-[12px] border-b border-border-hairline px-[14px] py-[10px] last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-body-sm text-text-strong">{item.file.name}</p>
                {item.error && <p className="m-0 text-body-sm text-red-3">{item.error}</p>}
              </div>
              <span
                className={`shrink-0 text-micro font-bold uppercase tracking-[var(--ls-label)] ${
                  item.state === "done" ? "text-green-3" : item.state === "error" ? "text-red-3" : "text-text-muted"
                }`}
              >
                {STATE_LABEL[item.state]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-[24px] flex flex-wrap items-center gap-[16px]">
        <Button variant="primary" size="md" onClick={publish} disabled={!canPublish}>
          {busy ? "Publicando…" : waiting.length > 0 ? `Publicar ${waiting.length} ${waiting.length === 1 ? "foto" : "fotos"}` : "Publicar fotos"}
        </Button>
        {done > 0 && !busy && (
          <Button variant="ghost" size="sm" onClick={() => setItems((c) => c.filter((i) => i.state !== "done"))}>
            Limpar publicadas ({done})
          </Button>
        )}
        {!busy && waiting.length > 0 && sessionId === "" && (
          <p className="m-0 text-body-sm text-text-muted">Escolha a sessão para publicar.</p>
        )}
      </div>
    </section>
  );
}
