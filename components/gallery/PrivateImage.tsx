import type { ImgHTMLAttributes } from "react";

// <img> puro: o site é estático (GitHub Pages), sem otimizador de imagens.
// É o único lugar que renderiza foto do acervo.
export function PrivateImage({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- ver comentário acima
  return <img alt={alt} decoding="async" referrerPolicy="no-referrer" {...props} />;
}
