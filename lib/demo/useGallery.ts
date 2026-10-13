"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SEED_PHOTOS, type DemoPhoto } from "./seed";
import {
  deletedSeedIds,
  deleteStored,
  isAdmin as readAdmin,
  listStored,
  markSeedDeleted,
  resetDemo,
  saveStored,
  setAdmin,
  type StoredPhoto,
} from "./store";

function toPhoto(stored: StoredPhoto): DemoPhoto {
  return {
    id: stored.id,
    sessionId: stored.sessionId,
    thumbUrl: URL.createObjectURL(stored.thumb),
    webUrl: URL.createObjectURL(stored.web),
    width: stored.width,
    height: stored.height,
    local: true,
  };
}

/** Estado do demo: fotos fixas menos as excluídas, mais as enviadas aqui. */
export function useDemoGallery() {
  const [photos, setPhotos] = useState<DemoPhoto[]>(SEED_PHOTOS);
  const [admin, setAdminState] = useState(false);
  const [ready, setReady] = useState(false);
  const urls = useRef<string[]>([]);

  const load = useCallback(async () => {
    const deleted = deletedSeedIds();
    const stored = (await listStored()).map(toPhoto);
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = stored.flatMap((photo) => [photo.thumbUrl, photo.webUrl]);
    setPhotos([...SEED_PHOTOS.filter((photo) => !deleted.has(photo.id)), ...stored]);
    setAdminState(readAdmin());
    setReady(true);
  }, []);

  useEffect(() => {
    // Lê o que está guardado no navegador uma vez, ao abrir a página.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com IndexedDB/localStorage
    void load();
    const current = urls;
    return () => {
      for (const url of current.current) URL.revokeObjectURL(url);
    };
  }, [load]);

  const add = useCallback(async (stored: StoredPhoto) => {
    await saveStored(stored);
    const photo = toPhoto(stored);
    urls.current.push(photo.thumbUrl, photo.webUrl);
    setPhotos((current) => [...current, photo]);
  }, []);

  const remove = useCallback(async (photo: DemoPhoto) => {
    if (photo.local) await deleteStored(photo.id);
    else markSeedDeleted(photo.id);
    setPhotos((current) => current.filter((p) => p.id !== photo.id));
  }, []);

  const reset = useCallback(async () => {
    await resetDemo();
    await load();
  }, [load]);

  const logout = useCallback(() => {
    setAdmin(false);
    setAdminState(false);
  }, []);

  return { photos, admin, ready, add, remove, reset, logout };
}
