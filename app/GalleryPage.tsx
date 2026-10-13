"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminBar } from "@/components/admin/AdminBar";
import { Wordmark } from "@/components/brand/Wordmark";
import { Gallery } from "@/components/gallery/Gallery";
import { SessionTabs } from "@/components/gallery/SessionTabs";
import { EVENT, SESSIONS } from "@/lib/demo/seed";
import { useDemoGallery } from "@/lib/demo/useGallery";

const headerLink =
  "cursor-pointer border-0 bg-transparent p-0 text-micro font-semibold text-ink-5 no-underline outline-none transition-[var(--transition-control)] hover:text-text-strong focus-visible:shadow-[var(--ring-focus)]";

export function GalleryPage() {
  const params = useSearchParams();
  const { photos, admin, ready, add, remove, reset, logout } = useDemoGallery();

  const activeSession = SESSIONS.find((s) => s.id === params.get("sessao")) ?? SESSIONS[0] ?? null;
  const tiles = photos.filter((photo) => photo.sessionId === activeSession?.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <p className="m-0 bg-clay-3 px-[var(--gutter-page)] py-[7px] text-center text-micro font-semibold text-text-on-accent">
        Demonstração: as fotos são geradas por código e o que você enviar fica só neste navegador.
      </p>

      <header className="sticky top-0 z-10 bg-surface-page">
        <div className="mx-auto flex max-w-[var(--max-content)] items-start justify-between gap-[16px] px-[var(--gutter-page)] pt-[18px]">
          <h1 className="m-0">
            <Wordmark />
            <span className="sr-only"> · {EVENT.name}</span>
          </h1>
          <div className="flex flex-col items-end gap-[6px] pt-[2px]">
            <p className="m-0 text-micro font-semibold tracking-[var(--ls-label)] text-text-muted" aria-hidden="true">
              {EVENT.name}
            </p>
            {admin ? (
              <button type="button" onClick={logout} className={headerLink}>
                Sair
              </button>
            ) : (
              <Link href="/login/" className={headerLink}>
                Entrar
              </Link>
            )}
          </div>
        </div>
        <SessionTabs sessions={SESSIONS} activeId={activeSession?.id ?? null} />
      </header>

      {admin && (
        <AdminBar sessions={SESSIONS} activeSessionId={activeSession?.id ?? null} onSave={add} onReset={reset} />
      )}

      <main className="mx-auto w-full max-w-[var(--max-content)] flex-1 px-[var(--gutter-page)] pb-[64px] pt-[18px]">
        <p className="mb-[14px] mt-0 text-micro font-semibold uppercase tracking-[var(--ls-label)] text-ink-5">
          {activeSession ? `${activeSession.name} · ` : ""}
          {tiles.length} {tiles.length === 1 ? "foto" : "fotos"}
        </p>
        {ready && (
          <Gallery
            key={activeSession?.id ?? "todas"}
            tiles={tiles}
            sessionName={activeSession?.name ?? null}
            isAdmin={admin}
            onDelete={remove}
          />
        )}
      </main>

      <footer className="border-t border-border-hairline px-[var(--gutter-page)] py-[24px] text-center text-body-sm text-text-muted">
        Vela Gallery é um projeto de portfólio. Evento e fotos fictícios.
      </footer>
    </div>
  );
}
