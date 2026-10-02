# Detalhe administrativo da clínica

`/clinics/:id` usa uma navegação lateral como o detalhe do paciente:
**Dados clínica**, **Assinatura** e **Auditoria**. Auditoria aparece desativada
até existir uma visão específica da clínica. A aba Assinatura contém seletores
de plano e status administrativo, cada um com botão para salvar, além da ação
de retirar ou recolocar a taxa de instalação para `super admin` por um toggle.
Configurações avançadas do plano continuam acessíveis pelo drawer existente.
Os seletores de plano e status usam o componente `AppSelect`, com estado
desabilitado durante o salvamento. O drawer avançado organiza plano,
funcionalidades e limite adicional em seções visuais; a aba Auditoria não
mostra texto auxiliar enquanto estiver desativada.

Na aba Assinatura, o super admin vê o término atual do teste e pode escolher
um horário exato no campo de data e hora. Os presets de 7, 14 e 30 dias somam
tempo ao término atual quando ele ainda está no futuro; caso contrário, partem
do horário atual. O horário é exibido no fuso local do navegador e enviado à
API em UTC. O botão salva pelo `PATCH /admin/subscriptions/:id/trial-end`.
O controle aceita clínicas sem assinatura Stripe em qualquer status local,
inclusive **Não pago**, aplicando a mesma regra de teste local do convite.
Assinaturas Stripe ativas ou vitalícias bloqueiam o controle. A API rejeita
datas passadas.

O status administrativo não paga faturas Stripe. O toggle chama
`PATCH /admin/subscriptions/:id/installation-fee` com `waived: true` para
dispensar e `waived: false` para reativar a cobrança no próximo checkout.
Uma taxa já paga não pode ser reativada. As mudanças pedem confirmação.

O logo vem da URL assinada entregue pela API. Se a imagem falhar, o detalhe e
o cartão da clínica exibem o ícone substituto; a lista de assinaturas também
faz fallback. Ao renovar os dados da clínica,
a API gera uma URL nova. Para verificar, execute `npm run build`, abra uma
clínica com logo e teste as abas em larguras de desktop e celular.

A lista de assinaturas usa o mesmo toggle reversível. O controle fica
desativado somente quando a taxa já foi paga e não está dispensada.
