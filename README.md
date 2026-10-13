# Vela Gallery · demo

Galeria de fotos de evento, versão de portfólio. Evento fictício
(**Solstício 2026**, sessões I a V), fotos geradas por código e nenhum
servidor: o site é estático e roda inteiro no navegador, pronto para o
GitHub Pages.

O que dá para fazer:

- ver as fotos por sessão, abrir em tela cheia (setas, teclado ou arrastar
  no celular) e baixar em JPG;
- entrar como admin com **admin / admin** e enviar fotos (convertidas para
  WebP no próprio navegador, sem EXIF) ou excluir fotos;
- "Restaurar demo" volta ao estado original.

## Como o demo guarda as coisas

| O quê | Onde |
|---|---|
| Fotos do demo | `public/demo/photos/` (geradas por `scripts/generate-photos.py`) |
| Fotos enviadas | IndexedDB do navegador de quem enviou |
| Fotos do demo excluídas | `localStorage` (lista de ids) |
| "Login" de admin | `localStorage` |

Nada sai do navegador: outro visitante sempre vê o demo original. O login é
só uma chave de interface, não é segurança.

Esta versão nasceu de um app real (Next.js + Supabase + Cloudflare R2, com
URLs assinadas, regras de acesso no banco e upload direto para o bucket).
Aqui a camada de servidor foi trocada pelo armazenamento do navegador; a
interface, o processamento de imagem e o visualizador são os mesmos.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # gera o site estático em out/
```

Fotos de exemplo novas: `pip install numpy pillow && npm run photos`.

## Publicar no GitHub Pages

1. Crie o repositório e envie o código para a branch `main`.
2. Em **Settings → Pages → Build and deployment**, escolha **GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` gera o site e publica em
   `https://<usuário>.github.io/<repositório>/`. O caminho base é preenchido
   sozinho pelo `actions/configure-pages`.

Para testar o build com caminho base localmente:

```bash
NEXT_PUBLIC_BASE_PATH=/vela-gallery-demo npm run build
```

## Stack

Next.js 16 (export estático), React 19, Tailwind CSS v4, TypeScript.
