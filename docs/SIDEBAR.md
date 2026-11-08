# Sidebar do admin

`src/components/layout/Sidebar.vue`, no mesmo padrão da sidebar oficial do `crm-clinica`: itens com **▾** agrupam páginas parecidas e **expandem ao clicar**; item sem ▾ vai direto para a página.

## Regras

- **Categoria nova (título em cinza) só para algo muito importante e diferente** do resto. Hoje existem apenas: sem título (Dashboard), **Gestão**, **Lia** (produto de IA próprio) e **Super admin** (poderes exclusivos do super admin, que não fazem parte da operação do sistema; só aparece para ele). Não crie categoria para agrupar páginas comuns: crie um item expansível.
- Páginas relacionadas viram **filhos** de um item expansível (`children`). Um item com uma única página fica simples, sem ▾.
- O grupo da página atual abre sozinho ao entrar na rota (por exemplo, `/clinics/123` abre Clínicas) e mais de um grupo pode ficar aberto.
- Permissão: itens e filhos são filtrados por papel dentro do `computed` do menu; um grupo sem filhos visíveis não aparece.
- Com a sidebar recolhida não há submenu: clicar no grupo abre a primeira página dele.
- O grupo é um `<button>` com `aria-expanded` e `aria-controls`; o submenu fecha/abre com animação de altura.

## Estrutura atual

| Onde | Item | Páginas |
| --- | --- | --- |
| sem título | Dashboard | `/` |
| Gestão | Clínicas ▾ | Todas as clínicas (`/clinics`), Assinaturas (`/subscriptions`), Armazenamento (`/storage`, admin) |
| Gestão | Usuários ▾ | Usuários (`/users`), Convites (`/invitations`) |
| Gestão | Campanhas | `/campaigns` |
| Gestão | Comunicação ▾ | Notificações (`/notifications`), WhatsApp (`/whatsapp`), Avaliações (`/surveys`) |
| Gestão | Auditoria ▾ | Sistema (`/audit/system`, admin), Financeira (`/audit/financial`, super admin) |
| Lia | Uso e tokens, Erros e qualidade, Feedbacks | `/lia`, `/lia/quality`, `/lia/feedback` (admin) |
| Super admin | Equipe Admin | `/team` (somente super admin) |

## Como adicionar uma página

1. Crie a rota em `src/router/index.js` com `meta.roles` se houver restrição.
2. Em `sidebarSections`, adicione o item como filho do grupo mais próximo (ou como item simples se for único e importante).
3. Atualize esta tabela e o [cabeçalho da página](PADRAO_CABECALHO_PAGINA.md) se houver ícone novo.

## Verificação

`npm run build` e conferir no navegador: o grupo da rota atual abre sozinho, clicar em outro grupo expande com a seta girando, e o indicador azul acompanha o item ativo.
