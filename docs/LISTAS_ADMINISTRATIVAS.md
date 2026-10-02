# Listas administrativas

Em `/users`, a coluna Clínica mostra o nome da clínica associada e, quando a API fornece seu `_id`, oferece o link **Ir para clínica** para `/clinics/:id`. O vínculo também cobre proprietários, resolvidos pela API administrativa de usuários. Usuários sem clínica não exibem o link.

Em `/clinics`, as clínicas aparecem em linhas com nome, logo, CNPJ, responsável, plano, status da assinatura e localização. A linha inteira abre o detalhe da clínica. A busca e a paginação existentes continuam disponíveis. Em telas estreitas, as colunas são empilhadas. Se o logo falhar, um ícone ocupa seu lugar.

Para verificar a interface, execute `npm run build` em `crm-clinica-admin` e confira as duas rotas em desktop e celular.
