# Retrospectiva no detalhe da clínica

A aba **Retrospectiva** em `/clinics/:id` (todos os papéis administrativos; `?tab=retrospective`
abre direto nela) mostra as retrospectivas anuais geradas para a clínica. Componente:
`src/components/pages/clinics/ClinicRetrospectivePanel.vue`.

Fonte: `GET /admin/clinics/:clinicId/retrospectives` (lista, sem os stories) e
`GET /admin/retrospectives/:id` (documento completo). Contrato e geração na API:
[api-clinic/docs/RETROSPECTIVA.md](../../api-clinic/docs/RETROSPECTIVA.md).

## O que cada cartão (um por ano) mostra

- **Status**: Rascunho, Agendada ou Publicada.
- **Liberação** (`publishAt`) ou, quando publicada, **Publicada em** (`publishedAt`).
- **Versão**: Completa ou Reduzida, com a quantidade de stories.
- **Visualizou?**: "Sim" com data e hora da primeira visualização (`tracking.firstViewedAt`),
  quem abriu (quando disponível) e o total de aberturas; ou "Não".
- **Compartilhamentos**: `tracking.shareCount` e a data do último.
- **Ver dados gerados**: abre um drawer com o JSON do snapshot (ano, design, variação de texto,
  período, mês em andamento e stories). O rastreio não entra no JSON, já que aparece no cartão.

Estado vazio: "Nenhuma retrospectiva gerada para esta clínica" (com o botão **Fazer retrospectiva** para quem pode gerar). Falha de carregamento mostra a
mensagem no lugar dos cartões; "Atualizar" tenta de novo.

## Gerar e publicar (só super admin e admin)

- **Fazer retrospectiva** (sem nenhuma retrospectiva): `POST /admin/clinics/:clinicId/retrospectives/generate`. Cria o **rascunho**; o dono não vê nada.
- **Gerar novamente** (rascunho/agendada): recalcula com `force`, mantendo o rastreio. Publicada nunca é regerada.
- **Publicar retrospectiva**: pede confirmação ("o dono passa a ver o banner e o atalho") e chama `POST /admin/retrospectives/:id/publish`. Vale só para aquela clínica.
- Sucesso e erro aparecem em uma faixa no topo da aba, com a mensagem em português devolvida pela API (ex.: clínica sem atendimentos no período). Suporte só consulta: os botões não aparecem.

Fora de escopo por enquanto: coluna na lista de clínicas, tela própria e card no dashboard.

## Testes

```bash
npx vitest run tests/retrospective.spec.js
```

Cobre cartões com dados de exemplo (publicada, agendada, rascunho), o JSON no drawer, o estado
vazio e o erro.
