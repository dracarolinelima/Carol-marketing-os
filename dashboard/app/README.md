# Central de Comando — Dashboard app

Nova interface do Marketing OS (Fase 1 do ROADMAP), servida em `/app` pelo
`dashboard/server.js`. Não substitui `/v2`, que continua funcionando em
paralelo até haver paridade.

Depois de mudar algo em `src/`, rode `npm run build` aqui dentro — o servidor
Node serve o conteúdo de `dist/`, não lê `src/` diretamente.

Para desenvolvimento com hot-reload: `npm run dev` (abre em outra porta, com
proxy de `/api` para `localhost:3000` — o servidor Node precisa estar rodando
em paralelo).

Veja `docs/desktop-handoff/` na raiz do projeto para o contexto completo.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
