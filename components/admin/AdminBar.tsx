"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { DemoSession } from "@/lib/demo/seed";
import type { StoredPhoto } from "@/lib/demo/store";
import { UploadPanel } from "./UploadPanel";

export function AdminBar({
  sessions,
  activeSessionId,
  onSave,
  onReset,
}: {
  sessions: DemoSession[];
  activeSessionId: string | null;
  onSave: (photo: StoredPhoto) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="border-b border-border-hairline bg-surface-sunken">
      <div className="mx-auto max-w-[var(--max-content)] px-[var(--gutter-page)] py-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <p className="m-0 text-[15px] font-bold uppercase tracking-[var(--ls-label)] text-text-accent">Painel admin</p>
          <div className="flex flex-wrap items-center gap-[8px]">
            {confirmReset ? (
              <>
                <span className="text-body-sm text-text-muted">Apagar envios e exclusões deste navegador?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await onReset();
                    setConfirmReset(false);
                  }}
                >
                  Restaurar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                Restaurar demo
              </Button>
            )}
            {!uploading && (
              <Button variant="primary" size="sm" iconLeft={<Icon name="upload-cloud" size={15} />} onClick={() => setUploading(true)}>
                Enviar fotos
              </Button>
            )}
          </div>
        </div>

        {uploading && (
          <div className="mt-[16px]">
            <UploadPanel
              sessions={sessions}
              defaultSessionId={activeSessionId}
              onSave={onSave}
              onClose={() => setUploading(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
