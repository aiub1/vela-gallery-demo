// Arquivos de `public/` usados em <img src> e downloads precisam do caminho base
// do GitHub Pages; o next/link já o aplica sozinho.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
