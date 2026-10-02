# Auditoria administrativa

A tela `/audit/system` consulta `GET /admin/audit/system` e mostra eventos de
conta, autenticação, segurança, equipe e solicitações de assinatura. A linha
principal apresenta descrição, resultado, ação, usuário relacionado e data.
Os detalhes exibem ator, alvo, IP, agente do navegador, ID da requisição e
alterações quando disponíveis. Tentativas sem conta podem aparecer sem autor.

Os filtros de data, clínica, autor, ação e resultado são enviados à API e
persistidos na URL. A ação é escolhida em uma lista predefinida; os atalhos
Todos, Login admin, Falhas, IPs bloqueados, Contas criadas e Assinaturas
aplicam ação e resultado com um clique. Os demais filtros continuam ativos
até serem limpos. `/audit/financial` permanece separado e mostra eventos
de cobrança e confirmações da Stripe. A visibilidade das rotas segue as
permissões da API: `admin` e `super admin` para sistema, apenas `super admin`
para financeiro.

A API combina os eventos do sistema com os históricos de autenticação de
usuários e administradores. Por isso, logins já registrados em `authaudits`
ou `adminaudits` também aparecem na tela, respeitando os mesmos filtros.
Na lista, o título legível, resultado, pessoa relacionada, origem e horário
resumem o evento. O painel expandido mostra somente dados disponíveis, como
IP, navegador, clínica e IDs; o motivo traduzido da falha aparece junto ao
evento. O painel financeiro mantém os detalhes próprios de cobrança.

Verificação: executar `npm run build`; abrir `/audit/system`, confirmar que
agendamentos não aparecem e expandir eventos de login e bloqueio para conferir
o contexto. O contrato e o catálogo de eventos ficam em
`api-clinic/docs/AUDITORIA.md`.
