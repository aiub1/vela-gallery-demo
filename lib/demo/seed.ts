import seed from "./seed.json";
import { asset } from "./paths";

// Evento fictício do demo. As fotos são paisagens geradas por
// scripts/generate-photos.py: sem pessoas e sem direitos de terceiros.

export const EVENT = { name: "Solstício 2026", slug: "solsticio-2026" } as const;

export type DemoSession = { id: string; name: string };
export type DemoPhoto = {
  id: string;
  sessionId: string;
  thumbUrl: string;
  webUrl: string;
  width: number;
  height: number;
  /** enviada neste navegador (IndexedDB), não faz parte do demo */
  local: boolean;
};

export const SESSIONS: DemoSession[] = seed.sessions;

export const SEED_PHOTOS: DemoPhoto[] = seed.photos.map((photo) => ({
  ...photo,
  thumbUrl: asset(`/demo/photos/${photo.id}-thumb.webp`),
  webUrl: asset(`/demo/photos/${photo.id}-web.webp`),
  local: false,
}));
