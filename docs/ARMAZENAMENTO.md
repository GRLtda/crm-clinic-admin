# Armazenamento no admin

`/storage` aparece no menu Gestão para `admin` e `super admin`. Mostra total
ocupado em GB, arquivos que consomem cota e isentos, incluindo assinaturas,
identidade visual e fotos de perfil. A tabela pagina 20 clínicas por vez,
ordenadas por nome. A busca literal pelo início do nome tem debounce de 350 ms
e reinicia a página. O total geral permanece global durante a busca.

**Ver arquivos** abre `/clinics/:id?tab=storage`. A aba **Armazenamento** do
detalhe só carrega quando aberta e usa o mesmo `StoragePanel`. Mostra totais
físicos, cota da clínica, distribuição por categoria, bloqueio/inventário em
atualização e arquivos com nome, categoria, tamanho, isenção, estado e
quantidade de objetos/versões. Filtros de categoria e cobrança reiniciam o
cursor; **Carregar mais arquivos** busca somente a próxima página de 20 itens.
Não há download/exclusão nesta interface. Suporte não vê a página nem a aba.

Os totais vêm do inventário com snapshot de até 60 segundos, sem polling nem
varredura S3 pelo navegador. O timestamp deixa claro quando foram calculados;
Atualizar respeita o cache do servidor. Arquivos não inventariados não estão
incluídos. Totais e contadores de cota podem divergir durante operações.
Contrato, permissões, índices e limites:
[Armazenamento administrativo da API](../../api-clinic/docs/ADMIN_STORAGE.md).

## Layout e estados

Volumes usam unidades automáticas: B abaixo de 1 KB, KB abaixo de 1 MB,
MB abaixo de 1 GB e GB a partir de 1 GB, com no máximo duas casas decimais
(GB mantém duas casas). Exemplo: 0,302 GB passa a 309,25 MB. Aplica-se aos
cards, linhas por clínica, reservas e arquivos; capacidade do plano segue GB.

Clínicas bloqueadas mostram a causa abaixo do status na listagem. No detalhe,
o aviso mostra as causas, quantidade de ocorrências e data da verificação,
além de informar que pacientes podem continuar assinando. Bloqueios antigos
sem registro mostram “Motivo não registrado”, sem inferir uma causa. A API
persiste o resumo da verificação; abrir a tela não consulta o S3.

Cards seguem a apresentação do armazenamento do CRM: borda discreta, branco,
azul da marca, cantos arredondados e espaçamento uniforme. O admin reutiliza
`AppButton`, `AppSelect`, `SearchInput`, `SkeletonLoader` e `AppPagination`.
O `AppEmptyState` adotado do CRM e o SVG local `storage-empty.svg` seguem as
[regras de estados vazios](../../crm-clinica/docs/estados-vazios.md).

Primeira carga usa skeleton. Vazio só aparece após sucesso; erros mostram a
causa e botão de nova tentativa. Atualização falha mantém dados anteriores.
Troca de clínica invalida respostas antigas e limpa dados sensíveis anteriores.
Em celular, cards/filtros empilham e a tabela rola horizontalmente no próprio
contêiner. A barra respeita redução de movimento. Não há consultas periódicas.

## Testes e revisão

Execute `npm run test:storage` e `npm run build` em `crm-clinica-admin`.
Vitest + Vue Test Utils + JSDOM montam o componente real e simulam somente API
e links: totais/isenções, detalhe, skeleton, erro/nova tentativa, preservação
dos dados, SVG vazio, cursor, filtros, debounce e resposta antiga após troca.
Esses testes não comprovam comportamento dos serviços externos.

A revisão visual foi feita em prévia local com dados fictícios em desktop e
390px: totais, tabela, categorias, arquivos, filtros e rolagem interna.
Na implantação, conferir também a navegação real do menu e do detalhe,
permissões, clínica sem arquivos e inventário incompleto. A prévia não usou
credenciais nem acessou o banco/S3 de produção.
