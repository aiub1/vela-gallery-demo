import type { MouseEvent } from "react";
import type { DemoPhoto } from "@/lib/demo/seed";

// Download em JPG, convertido no navegador a partir da versão web (WebP).
// No celular, oferece a folha de compartilhamento ("Salvar imagem").

const JPEG_QUALITY = 0.92;

export function fileName(photo: DemoPhoto, ext: string): string {
  return `solsticio-2026-${photo.id}.${ext}`;
}

async function toJpeg(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas indisponível");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("falha ao gerar o JPG");
    return blob;
  } finally {
    bitmap.close();
  }
}

function clickLink(href: string, name: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareToGallery(blob: Blob, name: string): Promise<boolean> {
  if (!window.matchMedia("(pointer: coarse)").matches) return false;
  const file = new File([blob], name, { type: "image/jpeg" });
  if (typeof navigator.canShare !== "function" || !navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file] });
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) return false;
  }
  return true;
}

/** onClick dos links de download. Se a conversão falhar, baixa o WebP do próprio link. */
export async function downloadAsJpg(event: MouseEvent<HTMLAnchorElement>, photo: DemoPhoto): Promise<void> {
  event.preventDefault();
  const name = fileName(photo, "jpg");
  try {
    const blob = await toJpeg(photo.webUrl);
    if (await shareToGallery(blob, name)) return;
    const url = URL.createObjectURL(blob);
    clickLink(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    console.error("download em JPG falhou; baixando o WebP", error);
    clickLink(photo.webUrl, fileName(photo, "webp"));
  }
}
