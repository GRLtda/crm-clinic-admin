# Lia no admin

Categoria **Lia** do menu, visível para `admin` e `super admin`, com três páginas. Todas seguem o [cabeçalho padrão](PADRAO_CABECALHO_PAGINA.md) e a [tabela padrão](TABELA_PADRAO.md). A API e as regras de dados estão em [Observabilidade administrativa da Lia](../../api-clinic/docs/LIA.md#observabilidade-administrativa-uso-tokens-e-erros).

## Uso e tokens (`/lia`, `LiaUsageView.vue`)

- Seletor de período (7, 30 ou 90 dias) e botão Atualizar.
- Indicadores: tokens consumidos, **custo estimado em R$**, respostas, tokens por resposta e latência média. Uma nota abaixo do cabeçalho mostra o total em R$ e US$, a cotação usada e o custo médio por resposta.
- Gráfico de tokens por dia, clínicas e usuários ativos, conversas novas.
- Cartão lateral com duas abas: **Composição** (tokens de entrada, saída, raciocínio e cache, e custo por modelo) e **Ferramentas** (as 12 mais chamadas pela Lia, com nome legível e código, barra, total, participação e quantas chamadas retornaram erro). Os nomes legíveis ficam em `TOOL_LABELS` de `src/utils/liaFormat.js`; ferramenta nova aparece com o próprio código até ganhar rótulo.
- Ranking por **Clínicas** ou **Usuários**, alternando entre **Quem mais gasta** e **Quem menos gasta**. Cada linha mostra tokens com a participação no total, o **custo estimado** (R$ e US$), respostas, média por resposta, latência, erros e último uso. O "menos gasta" considera só quem usou a Lia no período.

## Erros e qualidade (`/lia/quality`, `LiaQualityView.vue`)

- Faixa de saúde: verde com taxa de erro abaixo de 2% e falha de ações abaixo de 10%; amarela caso contrário.
- Indicadores: taxa de erro (erros ÷ tentativas), total de erros, ações com confirmação que falharam e pedidos fora do escopo.
- Erros por dia, ações por estado (concluídas, falharam, pendentes, canceladas), erros mais frequentes, ferramentas com falha e lista paginada de erros recentes com clínica, tipo, etapa e detalhe técnico. Códigos têm rótulo legível em `src/utils/liaFormat.js`.

## Feedbacks (`/lia/feedback`)

Fila de avaliações e denúncias dos usuários. Veja [Qualidade da Lia](lia-feedback.md).

## Dados de teste (seed)

`node scripts/seed-lia-admin.js` em `api-clinic` popula dados **sintéticos** no banco configurado em `MONGO_URI`/`DB_NAME`: 5 clínicas `[SEED Lia] ...` com 9 usuários (sem senha, não fazem login), 108 conversas, ~525 respostas com tokens e latência, chamadas de ferramentas (algumas com erro), 160 ações (concluídas, falhas, canceladas e pendentes), 35 erros de vários tipos e 14 feedbacks (avaliações e denúncias, novos, em análise e resolvidos, alguns com contexto compartilhado). Repetir o comando recria o seed. `node scripts/seed-lia-admin.js --clean` remove tudo. Todo documento criado tem `seed: "lia-admin-demo"`; clínicas, usuários e conversas reais não são alterados (mas entram nos totais do período, como `Instituição Agenda`).

## Limitações

- O consumo usa a retenção das mensagens; o histórico de erros só existe a partir da versão que criou o registro e expira em 90 dias.
- O custo é **estimado** (tokens × preço por milhão, câmbio fixo configurável); não é a fatura do provedor. Veja [Custo estimado](../../api-clinic/docs/LIA.md#custo-estimado).

## Verificação

`npm run build` e `npm test` em `crm-clinica-admin`; `npm run test:lia-usage-admin` e `npm run test:lia` em `api-clinic`. Conferir as páginas com um usuário `admin`: a navegação some para `suporte`.
