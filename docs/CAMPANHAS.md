# Campanhas de cadastro

Painel em **Gestão → Campanhas** (`/campaigns`) para os links de evento com dias
grátis, como a feira **Posicionamento no Digital**. Regras, rotas e indicadores da
API: [Campanha de autocadastro](../../api-clinic/docs/ASSINATURA_E_TRIAL.md#campanha-de-autocadastro-com-teste-na-stripe).

## Permissões

- `super admin` e `admin`: criar, editar, pausar e excluir.
- `suporte`: só consulta. Os botões de escrita ficam ocultos e a API recusa com `403`.

## Lista (`/campaigns`)

Uma linha por campanha, com nome, link, dias grátis, período, situação (**Ativa**,
**Agendada**, **Encerrada**, **Pausada**), acessos e visitantes únicos, cadastros e
conversão, clínicas criadas e em teste, e assinantes. A busca filtra por nome ou
código. Clicar na linha abre o detalhe. As ações da linha copiam o link, editam ou
excluem.

## Formulário (criar e editar)

Campos: nome, código do link, dias grátis (1 a 90), início, fim e **Campanha ativa**.

- Na criação, o código é sugerido a partir do nome (sem acento, em minúsculas, com hífens) até ser editado. O link aparece abaixo do campo.
- Na edição, o código fica bloqueado, porque o link pode já ter sido divulgado.
- Início e fim são dias no horário de Brasília: o início vale a partir de 00:00 e o fim até 23:59:59. Vazio significa sem limite. O fim define o prazo do contador da landing page.
- Erros locais e da API (`fields`) aparecem no próprio campo e são limpos ao editar. Código repetido aparece no campo **Código do link**. Falhas gerais aparecem abaixo do formulário. O toast fica só para o sucesso.

## Exclusão

Pede confirmação. A campanha sai do painel e o link para de conceder os dias
grátis. Os cadastros já feitos, a origem das clínicas e os contadores continuam
salvos e aparecem nos filtros de **Clínicas** e **Usuários**. O código fica
reservado e não pode ser reutilizado. Para suspender temporariamente, use
**Campanha ativa** em vez de excluir.

## Detalhe (`/campaigns/:id`)

- Cabeçalho com situação, dias grátis, período e o link (clique para copiar).
- Indicadores: acessos ao link (com visitantes únicos e último acesso), cadastros e conversão, clínicas criadas (e quantos não concluíram), em teste (e quantos cadastraram o cartão) e assinantes (com atrasados e cancelados).
- **Quem se cadastrou**: nome, e-mail, telefone, data, clínica (com link para o detalhe) ou "Não concluiu o onboarding", e status da assinatura. Tem busca e paginação.

## Link divulgado

`campaignLink(code)` em `src/utils/signupCampaigns.js` monta
`${VITE_LANDING_URL}/evento/<code>`. Sem `VITE_LANDING_URL`, usa
`https://www.agendadoutor.com`. A landing page conta o acesso e leva ao cadastro
com o código: [Landing page do evento](../../landing-page/docs/evento.md).

## Como verificar

1. `npm run build`.
2. Criar uma campanha, conferir a sugestão do código e os erros por campo (nome vazio, código inválido, fim antes do início, código repetido).
3. Abrir o link, voltar ao detalhe e conferir o acesso contado.
4. Cadastrar uma conta pelo link e conferi-la em **Quem se cadastrou**.
5. Editar dias e datas, pausar, excluir e conferir que a campanha some da lista e que o filtro de Clínicas ainda mostra a origem.
6. Entrar como `suporte` e conferir que só há consulta.
