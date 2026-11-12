# NEXT STEPS — Instruções para a próxima sessão

## 1. Abrir o projeto no Claude Code Desktop

1. Abra o aplicativo Claude no Mac e entre na área de **Code** (Claude Code).
2. Escolha abrir uma pasta local e selecione exatamente:
   `/Users/carollima/Documents/Carol-Marketing-OS/carol-marketing-os`
3. Confirme que a sessão está na branch `carol-v1`.
4. Cole o prompt da seção 4.

**Por que a mesma pasta:** a migração não move arquivos. O Claude Code Desktop
trabalha sobre a mesma pasta, com o mesmo Git, os mesmos dados e o mesmo
CLAUDE.md. A memória automática fica em
`~/.claude/projects/-Users-carollima-Documents-Carol-Marketing-OS-carol-marketing-os/memory/`,
associada ao caminho da pasta. Abrindo o mesmo caminho, espera-se que ela continue
disponível. **Confirmar na primeira sessão.**

O VS Code pode continuar instalado. Evite as duas ferramentas editando os mesmos
arquivos ao mesmo tempo.

## 2. Primeira sessão: o que fazer

1. Ler `docs/desktop-handoff/README.md` e os documentos na ordem indicada.
2. Ler o [Marketing Core](../../memory/carol-marketing-os/marketing-core.md) e o
   [CLAUDE.md](../../CLAUDE.md) integralmente.
3. Rodar `git status` e comparar com a seção 3 abaixo.
4. Confirmar se a memória automática e os conectores (Metricool, Windsor) aparecem.
5. Apresentar à Dra. Caroline as decisões D1 a D4 de [DECISIONS.md](DECISIONS.md).
6. Só depois da aprovação, iniciar a Fase 0 do [ROADMAP.md](ROADMAP.md).

## 3. Estado do Git no momento do handoff (11/11/2026)

- Branch: `carol-v1`; último commit `a81a7e1`.
- Remote `origin`: `https://github.com/ericosiu/marketing-os-starter.git`
  (template público de terceiros). **Não fazer push.**
- 6 arquivos modificados, 1.040 inserções e 77 remoções não commitadas.
- Itens não rastreados: `dashboard/copy-store.js`, `dashboard/tests/test-copy-editor-ui.js`,
  `dashboard/tests/test-copy-store.js`, `dashboard/tests/test-strategy-actions.js`,
  `dashboard/update-strategy.md`, `dashboard/v2/copy-editor.js`, `renderer/fonts/`,
  `tests/marketing-os/campaigns/agenda-novembro-2026.md`,
  `tests/marketing-os/entrega-aprendizado-editorial-2026-10-13.md`,
  `tests/marketing-os/premortem-editorial-learnings.md`, `tests/marketing-os/published/`
  e esta pasta `docs/`.
- `dashboard/data/` fora do Git (por `.gitignore`).

## 4. Prompt para iniciar a próxima sessão

```
Estou continuando o desenvolvimento do Marketing OS da Dra. Caroline Lima, agora no
Claude Code Desktop. A pasta do projeto é
/Users/carollima/Documents/Carol-Marketing-OS/carol-marketing-os, branch carol-v1.

Antes de qualquer ação:
1. Leia docs/desktop-handoff/README.md e todos os documentos daquela pasta, na
   ordem indicada.
2. Leia integralmente memory/carol-marketing-os/marketing-core.md e CLAUDE.md.
3. Rode git status e compare com docs/desktop-handoff/NEXT-STEPS.md, seção 3.
   Informe qualquer diferença.
4. Confirme se a memória automática do projeto e os conectores Metricool e
   Windsor estão disponíveis nesta sessão.

Contexto: decidi construir uma Central de Comando visual, inspirada na plataforma
da Talita, aproveitando agentes, dados e funcionalidades existentes. A visão está
em PRODUCT-VISION.md, os requisitos em REQUIREMENTS.md e o plano em ROADMAP.md.

Nesta sessão:
- Apresente as decisões pendentes D1 a D4 de DECISIONS.md com sua recomendação.
- Depois da minha aprovação, execute a Fase 0 do ROADMAP, uma etapa por vez,
  explicando antes se cada ação consulta, cria, altera, substitui, instala ou envia
  algo externamente.

Restrições: não faça git push para o origin atual (é o template público de
terceiros). Não exclua dados de dashboard/data/. Não altere o Marketing Core.
Não publique nem envie nada externamente sem minha aprovação.
```

## 5. Informações não verificadas nesta etapa

- Resultado atual dos 4 testes em `dashboard/tests/` (não executados).
- Capacidades reais de Metricool e Windsor (só a conexão foi confirmada).
- Disponibilidade dos conectores e da memória automática no Claude Code Desktop.
- Uso real de `schemas/` e `.claude/agents/shared/decision-interface.md`.
- Estado do ManyChat (palavra-chave PÓLIPO).
- ~~Detalhes visuais da plataforma da Talita (vídeo não disponível no repositório).~~
  Resolvido em 11/11/2026: material real disponível em
  `../Inspiração dasboard Talita/` (ver PRODUCT-VISION.md).
