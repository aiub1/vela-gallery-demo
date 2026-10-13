import type { NextConfig } from "next";

// Site 100% estático para o GitHub Pages: `next build` gera a pasta `out/`.
// No Pages de projeto o site fica em https://<usuário>.github.io/<repositório>/,
// então o caminho base vem de NEXT_PUBLIC_BASE_PATH (o workflow preenche com
// "/<repositório>"). Vazio em desenvolvimento ou em domínio próprio.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
