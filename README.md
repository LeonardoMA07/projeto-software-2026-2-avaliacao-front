# Front de Avaliações

Front em React + Vite que lista e cadastra avaliações, com login pelo Auth0.
O formulário de cadastro só aparece para quem tem o papel ADMIN; ADMIN e USER veem a lista.

Publicado em: https://projeto-software-2026-2-avaliacao-f.vercel.app

## Rodar localmente

```
npm install
npm run dev
```

Em dev, o Vite redireciona `/api/*` para o back em `http://localhost:8080` (ver `vite.config.js`).
Na Vercel, o `vercel.json` faz o mesmo redirecionamento para a API na EC2 (`http://44.200.39.146:8080`).

A configuração do Auth0 (domínio, client ID e audience) está em `src/main.jsx`.

## Deploy na Vercel

O projeto da Vercel está conectado a este repositório: cada push na `main` publica automaticamente em produção.
