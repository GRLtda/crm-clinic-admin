# Qualidade da Lia

A página `/lia/feedback` integra a fila real de avaliações e denúncias do piloto. Apenas administradores e super administradores têm navegação e acesso ao backend; suporte não vê o menu. O backend também confere a identidade administrativa no banco.

Os filtros são tipo, estado e voto. A lista é paginada e não contém o conteúdo das conversas. O detalhe mostra comentário e, somente quando o usuário optou por compartilhar, a pergunta e a resposta anexadas. Não existe consulta automática ao chat original para recuperar contexto não autorizado. Todo conteúdo é renderizado como texto escapado. Troca de identidade ou desmontagem invalidam respostas assíncronas e limpam o detalhe.

Estados de triagem: Novo, Em análise e Resolvido. A nota é interna e limitada a 2.000 caracteres. A atualização envia a versão do registro e o backend rejeita edições concorrentes com 409. O histórico mantém ator, estado, nota e horário das últimas 30 revisões. Não há envio automático de mensagens ou providências contra a clínica: o painel registra a análise humana.

Endpoints relativos à base administrativa existente: `GET /lia/feedback`, `GET /lia/feedback/:id`, `PATCH /lia/feedback/:id`. Publicar a API compatível antes do painel. Execute `npm run test:storage` para os testes existentes e os da fila da Lia, e `npm run build` para validar o build.
