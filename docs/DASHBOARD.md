# Dashboard do admin

Página `/` (`src/views/DashboardView.vue`, store `src/stores/dashboard.js`). Mostra o que importa para quem administra a plataforma; **não** mostra pacientes nem atendimentos (isso é assunto de clínica). Dados e fórmulas: [Dashboard do admin (API)](../../api-clinic/docs/DASHBOARD_ADMIN.md).

## Layout

1. **Cabeçalho** padrão com seletor de período (7 dias, 1 mês, 6 meses, 12 meses).
2. **Indicadores:** receita mensal estimada (só `admin`/`super admin`), clínicas pagantes (+ vitalícias), em teste (com quantas vencem em 7 dias), inadimplentes, cancelamentos no período e clínicas/usuários com a conversão do período.
3. **Gráficos:** novas clínicas por período, status das assinaturas e clínicas por plano.
4. **Precisa de atenção:** testes vencendo, pagamentos atrasados, armazenamento no limite e clínicas sem movimento na agenda. Cada linha mostra avatar com a inicial, nome, um selo de situação (Vence amanhã, Atrasada, 92% usado, 49 dias parada) e o detalhe; o armazenamento tem barra de uso (vermelha a partir de 95%). A linha inteira leva ao detalhe da clínica; sem itens, mostra uma mensagem positiva.
5. **Cadastros por campanha** (tabela padrão) e cartão da **Lia** (tokens, custo estimado, taxa de erro, feedbacks novos) com atalhos para `/lia`, `/lia/quality` e `/lia/feedback`. O cartão da Lia não aparece para `suporte`.

## Regras

- Os cartões de indicadores usam a fonte normal do sistema (Montserrat, peso 600), não a fonte de títulos, para os números ficarem legíveis. Vale para todos os `KPICard`.
- Valores em dinheiro são **estimativas** e saem do cálculo da API; a tela não recalcula nada.
- Troca de período cancela respostas antigas (a última requisição vence).
- Erro de carregamento mostra aviso na página e toast; a Lia indisponível só desativa o próprio cartão.
- Siga [cabeçalho](PADRAO_CABECALHO_PAGINA.md) e [tabela padrão](TABELA_PADRAO.md).

## Verificação

`npm run build` e `npx vitest run` em `crm-clinica-admin`; `npm run test:dashboard-admin` em `api-clinic`. No navegador: trocar o período, abrir um link de "Precisa de atenção" e conferir que a página não ganha rolagem por causa das tabelas. Reinicie a API para ela servir o formato novo de `/admin/summary`.
