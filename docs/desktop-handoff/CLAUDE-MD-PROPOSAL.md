# Proposta de acréscimo ao CLAUDE.md (NÃO APLICADA)

**Status:** proposta aguardando aprovação da Dra. Caroline (decisão D12).
O [CLAUDE.md](../../CLAUDE.md) atual permanece intacto.

## Diagnóstico

O CLAUDE.md atual (seções 1 a 21) define papéis, hierarquia, autonomia e
proibições. Ele não informa:

- onde está a documentação de handoff;
- a estrutura técnica (dashboard, servidor, dados, renderizador);
- que o `origin` do Git é o template público de terceiros;
- que `dashboard/data/` está fora do Git;
- a decisão de construir a Central de Comando.

## Proposta

Acrescentar **uma nova seção ao final**, sem alterar nenhuma seção existente:

```markdown
---

## 22. CONTINUIDADE TÉCNICA E CENTRAL DE COMANDO

A documentação de continuidade do projeto está em `docs/desktop-handoff/`.
Novas sessões de desenvolvimento devem começar por `docs/desktop-handoff/README.md`.

Esses documentos descrevem estrutura, estado atual, requisitos, integrações,
decisões e roadmap. Eles não substituem o Marketing Core nem este arquivo.

Estrutura técnica principal:

- `dashboard/server.js`: API local (porta 3000), protocolo de handoff, regras C1 a C8;
- `dashboard/v2/`: interface atual;
- `dashboard/data/`: estado editorial vivo (fora do Git; não apagar, não editar à mão);
- `renderer/`: renderização SVG para PNG;
- `tests/marketing-os/`: produção editorial e pacotes científicos.

Regras de desenvolvimento:

- não fazer `git push` para o remote `origin` enquanto ele apontar para o template
  público `ericosiu/marketing-os-starter`;
- preservar o Dashboard v2 em funcionamento até a nova interface atingir paridade;
- toda escrita de dados passa pela API, com `expectedRevision`;
- instalar dependências ou expor o servidor fora do computador exige aprovação.
```

## Por que acrescentar e não reescrever

O CLAUDE.md é o manual operacional aprovado. A seção 3 dele exige aprovação para
mudanças permanentes nas regras do sistema. Um acréscimo isolado preserva todas as
regras existentes e pode ser revertido sem efeito colateral.
