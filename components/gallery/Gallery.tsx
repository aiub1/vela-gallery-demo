"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { downloadAsJpg } from "@/lib/download/jpg";
import type { PhotoTile } from "@/lib/gallery/types";
import { Lightbox } from "./Lightbox";
import { PrivateImage } from "./PrivateImage";

const PAGE_SIZE = 48;

const roundButton =
  "grid h-[34px] w-[34px] place-items-center rounded-full border-0 no-underline outline-none transition-[var(--transition-control)] focus-visible:shadow-[var(--ring-focus)] ";
const downloadButton = roundButton + "bg-clay-3 text-night shadow-[0_2px_8px_rgba(0,0,0,.45)] hover:bg-clay-2";
const deleteButton = roundButton + "bg-night/72 text-snow hover:bg-red-3 hover:text-night";

function Tile({
  tile,
  position,
  isAdmin,
  onOpen,
  onDelete,
}: {
  tile: PhotoTile;
  position: number;
  isAdmin: boolean;
  onOpen: () => void;
  onDelete: (tile: PhotoTile) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  function remove() {
    setError(null);
    startDelete(async () => {
      try {
        await onDelete(tile);
      } catch {
        setError("Não foi possível excluir. Tente de novo.");
      }
    });
  }

  return (
    <li
      className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-card"
    >
      <span className="absolute inset-0 grid place-items-center text-ink-5">
        <Icon name="image" size={22} />
      </span>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir foto ${position}`}
        className="absolute inset-0 block h-full w-full cursor-zoom-in border-0 bg-transparent p-0 outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--clay-3)]"
      >
        <PrivateImage
          src={tile.thumbUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
        />
      </button>

      {tile.local && (
        <span className="pointer-events-none absolute left-[8px] top-[8px] rounded-[var(--radius-1)] bg-night/72 px-[8px] py-[4px] text-[10px] font-bold uppercase tracking-[var(--ls-label)] text-snow">
          Enviada por você
        </span>
      )}

      <div className={`absolute bottom-[8px] right-[8px] gap-[6px] ${confirming ? "hidden" : "flex"}`}>
        {isAdmin && (
          <button type="button" onClick={() => setConfirming(true)} aria-label={`Excluir foto ${position}`} className={deleteButton}>
            <Icon name="trash" size={16} />
          </button>
        )}
        <a href={tile.webUrl} download onClick={(event) => downloadAsJpg(event, tile)} aria-label={`Baixar foto ${position}`} className={downloadButton}>
          <Icon name="arrow-down" size={17} strokeWidth={2.25} />
        </a>
      </div>

      {confirming && (
        <div
          role="alertdialog"
          aria-label="Confirmar exclusão"
          className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] bg-night/88 p-[12px] text-center"
        >
          <p className="m-0 text-body-sm font-semibold text-snow">
            {error ?? "Excluir esta foto? (No demo, \"Restaurar demo\" traz de volta.)"}
          </p>
          <div className="flex flex-wrap justify-center gap-[8px]">
            <Button variant="primary" size="sm" onClick={remove} disabled={deleting} autoFocus>
              {deleting ? "Excluindo…" : "Excluir"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function Gallery({
  tiles,
  sessionName,
  isAdmin,
  onDelete,
}: {
  tiles: PhotoTile[];
  sessionName: string | null;
  isAdmin: boolean;
  onDelete: (tile: PhotoTile) => Promise<void>;
}) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const visible = tiles.slice(0, shown);
  const hasMore = tiles.length > shown;

  function loadMore() {
    setShown((n) => n + PAGE_SIZE);
  }

  // Chegou perto do fim no visualizador: mostra a próxima página.
  function show(index: number) {
    setOpen(index);
    if (hasMore && index >= visible.length - 3) loadMore();
  }

  function close() {
    setOpen(null);
    opener.current?.focus();
  }

  if (tiles.length === 0) {
    return (
      <div className="flex flex-col items-center px-[24px] py-[96px] text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-border-hairline bg-surface-card text-ink-5">
          <Icon name="frown" size={34} />
        </span>
        <p className="mb-0 mt-[24px] text-[14px] font-bold uppercase tracking-[var(--ls-label)] text-text-strong">
          Nenhuma foto ainda
        </p>
        <p className="mb-0 mt-[10px] max-w-[30ch] text-body-sm text-text-muted">
          Entre como admin (admin / admin) e envie as primeiras fotos desta sessão.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="m-0 grid list-none grid-cols-2 gap-[8px] p-0 sm:grid-cols-3 sm:gap-[12px] lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((tile, index) => (
          <Tile
            key={tile.id}
            tile={tile}
            position={index + 1}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onOpen={() => {
              opener.current = document.activeElement as HTMLElement | null;
              show(index);
            }}
          />
        ))}
      </ul>

      {hasMore && (
        <div className="mt-[32px] flex flex-col items-center gap-[12px]">
          <Button variant="outline" size="md" onClick={loadMore}>
            Carregar mais fotos
          </Button>
        </div>
      )}

      {open !== null && visible[open] && (
        <Lightbox
          tile={visible[open]}
          position={open + 1}
          total={tiles.length}
          hasMore={false}
          sessionName={sessionName}
          onClose={close}
          onPrev={open > 0 ? () => show(open - 1) : null}
          onNext={open < visible.length - 1 ? () => show(open + 1) : null}
        />
      )}
    </>
  );
}
