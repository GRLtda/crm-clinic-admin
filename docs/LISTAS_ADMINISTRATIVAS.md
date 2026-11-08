# Listas administrativas

Todas as listas do admin usam a [tabela padrão](TABELA_PADRAO.md) (`AppDataTable`). Não crie tabelas próprias.

Em `/users`, a coluna Clínica mostra o nome da clínica associada e, quando a API fornece seu `_id`, oferece o link **Ir para clínica** para `/clinics/:id`. O vínculo também cobre proprietários, resolvidos pela API administrativa de usuários. Usuários sem clínica não exibem o link.

Em `/clinics`, as clínicas aparecem em linhas com nome, logo, CNPJ, responsável, plano, status da assinatura e localização. A linha inteira abre o detalhe da clínica. A busca e a paginação existentes continuam disponíveis. Em telas estreitas, as colunas são empilhadas. Se o logo falhar, um ícone ocupa seu lugar.

Para verificar a interface, execute `npm run build` em `crm-clinica-admin` e confira as duas rotas em desktop e celular.

## Origem do cadastro (campanha da feira)

`/clinics` e `/users` têm o filtro **Origem**, com **Todas as origens** e as campanhas cadastradas em [Campanhas](CAMPANHAS.md). Ele envia `campaign=<código>` para a API, combinado com a busca, a função e a paginação. O total da paginação dá a contagem.

- Em `/clinics`, clínicas com `acquisition.campaign` mostram um selo verde com o nome da campanha ao lado do status. O status (`Em teste`, `Ativo`, `Atrasado`, `Cancelado`) mostra quem continuou depois dos 30 dias.
- Em `/users`, contas com `signupCampaign.code` mostram o mesmo selo abaixo do ID. Esse filtro inclui quem criou conta na feira e não concluiu o onboarding (coluna Clínica `N/A`), útil para o comercial entrar em contato.

As opções vêm de `GET /signup-campaigns` (`loadCampaignFilterOptions` em `src/utils/signupCampaigns.js`). O selo usa o nome gravado no cadastro, então continua aparecendo mesmo depois que a campanha é excluída. Regras da API: [Campanha de autocadastro](../../api-clinic/docs/ASSINATURA_E_TRIAL.md#campanha-de-autocadastro-com-teste-na-stripe).

Para verificar, aplicar o filtro nas duas rotas e conferir o selo, a contagem e a remoção do filtro em **Todas as origens**.
