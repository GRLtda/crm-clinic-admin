# Qualidade da Lia

A página `/lia/feedback` integra a fila real de avaliações e denúncias do piloto. Apenas administradores e super administradores têm navegação e acesso ao backend; suporte não vê o menu. O backend também confere a identidade administrativa no banco.

Os filtros são tipo, estado e voto. A lista é paginada e não contém o conteúdo das conversas. O detalhe mostra comentário e, somente quando o usuário optou por compartilhar, a pergunta e a resposta anexadas. Não existe consulta automática ao chat original para recuperar contexto não autorizado. Todo conteúdo é renderizado como texto escapado. Troca de identidade ou desmontagem invalidam respostas assíncronas e limpam o detalhe.

Estados de triagem: Novo, Em análise e Resolvido. A nota é interna e limitada a 2.000 caracteres. A atualização envia a versão do registro e o backend rejeita edições concorrentes com 409. O histórico mantém ator, estado, nota e horário das últimas 30 revisões. Não há envio automático de mensagens ou providências contra a clínica: o painel registra a análise humana.

Endpoints relativos à base administrativa existente: `GET /lia/feedback`, `GET /lia/feedback/:id`, `PATCH /lia/feedback/:id`. Publicar a API compatível antes do painel. Execute `npm run test:storage` para os testes existentes e os da fila da Lia, e `npm run build` para validar o build.


## Interface

A página usa o [cabeçalho padrão](PADRAO_CABECALHO_PAGINA.md) e a [tabela padrão](TABELA_PADRAO.md), com os filtros dentro da tabela. Tipo, estado e motivo são exibidos em texto de 14 a 15px e selos coloridos (Gostei verde, Não gostei âmbar, Denúncia vermelho; Novo azul, Em análise âmbar, Resolvido verde). O modal **Analisar feedback da Lia** é organizado em seções: resumo (tipo, estado, clínica, data, motivo e modelo), comentário do usuário em destaque, conversa compartilhada (pergunta e resposta em blocos separados) ou aviso de que não foi compartilhada, aviso sobre conteúdo não confiável e revisão administrativa (estado, nota interna com contador e histórico em linha do tempo). Pesos: títulos de seção 600, rótulos e valores 500, corpo e citações 400 (data e motivo na tabela em peso normal). Evite 700 em texto corrido e não use texto abaixo de 12px.
