# Tabela padrão do admin (`AppDataTable`)

O cabeçalho da página acima da tabela segue o [cabeçalho padrão](PADRAO_CABECALHO_PAGINA.md).

**Regra obrigatória:** todas as páginas do admin que listam dados em linhas **devem** usar `src/components/global/AppDataTable.vue`. Não crie `<table>` próprias nem CSS de tabela por página. Se faltar algo, estenda o componente.

O visual é o da tabela de **Pacientes** do `crm-clinica` (`PatientsListView.vue` com `AppTableList`): um único contêiner branco de borda arredondada, com a barra de filtros no topo, cabeçalho cinza fixo (`#f5f6f8`), linhas separadas por divisórias, hover azul claro (`#f0f4fc`) e paginação no rodapé do próprio contêiner.

## Condição obrigatória: altura fixa, sem rolagem na página

Nenhuma tabela pode criar rolagem na página. O `AppDataTable` limita a área das linhas a uma altura máxima (prop `height`, padrão `calc(100vh - 21rem)`, mínimo de 16rem): o corpo rola **por dentro**, com o cabeçalho fixo, e a paginação fica sempre visível logo abaixo. Assim a navegação entre páginas e a leitura não dependem de rolar a tela.

- Não coloque a tabela dentro de contêineres com altura livre nem remova o `max-height` da área de rolagem.
- Se houver conteúdo extra acima da tabela (cartões de resumo, avisos), aumente o desconto em `height`, por exemplo `height="calc(100vh - 28rem)"`, até a página inteira caber sem barra de rolagem. Valores já usados: equipe 28rem, avaliações 26rem, armazenamento 36rem, cadastros da campanha 38rem.
- Toda nova listagem deve ser conferida com a janela em desktop e celular: a barra de rolagem da página não pode aparecer por causa da tabela.

## Uso

```vue
<AppDataTable
  :columns="columns"
  :rows="store.users"
  :loading="store.loading"
  :pagination="store.pagination"
  :empty-icon="UserX"
  empty-title="Nenhum usuário encontrado"
  empty-text="Tente ajustar seus filtros de busca."
  @page-change="store.fetchUsers"
>
  <template #cell-name="{ row }">...</template>
</AppDataTable>
```

### Props

| Prop | Descrição |
| --- | --- |
| `columns` | `[{ key, label, width?, align?, skeletonWidth? }]`. `width` é uma largura CSS fixa (`120px`); sem ela a coluna se ajusta. `align`: `left`, `center` ou `right`. |
| `rows` | Itens exibidos. |
| `rowKey` | Campo único da linha (padrão `_id`). |
| `loading` / `skeletonRows` | Mostra linhas de skeleton (padrão 8). |
| `selectable` / `selectedKeys` | Coluna de checkbox com "selecionar página" no cabeçalho; use `v-model:selected-keys`. |
| `height` | Altura máxima da área de linhas (CSS). Veja a condição acima. |
| `clickable` | Linha focável e clicável; emite `row-click`. |
| `pagination` | `{ page, pages, total }`; só aparece com mais de uma página. |
| `emptyTitle`, `emptyText`, `emptyIcon` | Estado vazio (usa `AppEmptyState`). |

### Slots e eventos

- `cell-<key>` (`{ row, index }`): conteúdo da célula; sem slot mostra `row[key]`. Ações de linha ficam em uma coluna própria (ex.: `cell-actions`, `align: 'right'`).
- `skeleton-<key>`: skeleton personalizado da coluna.
- `filters`: barra de filtros no topo do contêiner (busca, selects). Os filtros ficam aqui, não no cabeçalho da página; o título e botões de ação da página ficam fora.
- `empty-illustration`: ilustração personalizada do estado vazio.
- Eventos: `page-change(page)`, `row-click(row)`.

## Responsivo

Até 768px o cabeçalho some, o contêiner perde a borda e cada linha vira um cartão com os rótulos (`label`) ao lado dos valores.

## Páginas

Todas as listagens atuais usam o componente: `/users`, `/clinics`, `/invitations`, `/signup-campaigns` (lista e cadastros do detalhe), avaliações (`SurveysView`), administradores (`AdminManagementView`) e as duas listas do painel de armazenamento (`StoragePanel`: clínicas e arquivos). Qualquer nova lista deve nascer com `AppDataTable`; não reintroduza `<table>`.

## Verificação

`npm run build` em `crm-clinica-admin` e conferir as rotas acima em desktop e celular (skeleton, vazio, paginação, clique na linha).
