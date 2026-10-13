import { Suspense } from "react";
import { GalleryPage } from "./GalleryPage";

// Página estática: a aba da sessão vem de ?sessao= e é lida no navegador.
export default function Home() {
  return (
    <Suspense>
      <GalleryPage />
    </Suspense>
  );
}
