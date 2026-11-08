# Gestão de Equipe (`/team`)

Tela do `crm-clinica-admin` (`src/views/AdminManagementView.vue`) para administrar quem acessa o painel. Aparece no menu na categoria **Super admin > Equipe Admin** (ver [Sidebar](SIDEBAR.md)) e só para **super admin**; a API também exige super admin em todas as rotas.

## Interface

Segue os padrões do admin: [cabeçalho de página](PADRAO_CABECALHO_PAGINA.md), [tabela padrão](TABELA_PADRAO.md) e modais `AppModal`.

- **Resumo:** total de membros, super admins e convites pendentes.
- **Filtros** (no topo da tabela, filtram no cliente): busca por nome, e-mail ou telefone e papel (Admin, Suporte, Super admin).
- **Tabela:** membro (avatar, nome, final do ID), papel, contato, status (`Ativo` ou `Pendente` com a data de expiração do convite) e ação de remover.
- **Novo Administrador:** modal com nome completo, e-mail corporativo, telefone e papel. O e-mail `nome.sobrenome@agendadoutor.com` é sugerido enquanto o nome é digitado, enquanto o campo não for editado à mão. Os erros de validação (nome sem sobrenome, e-mail inválido ou já cadastrado, telefone vazio) aparecem no próprio campo; só falhas gerais viram toast.
- **Senha temporária:** após criar, um modal mostra a senha com botão de copiar. Ela não é exibida de novo.
- **Remover:** modal de confirmação. Ninguém remove o próprio acesso (aviso imediato), e só super admin remove outro super admin.

## Rotas usadas (`/admin/team`)

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/team` | Lista os membros. |
| POST | `/team` | Cria o administrador (`name`, `email`, `phone`, `role`); responde 201 com a senha temporária. 400 com `message` para e-mail já cadastrado ou dados inválidos. |
| DELETE | `/team/:id` | Remove o acesso. 404 se não existir; 400 ao tentar remover o próprio acesso. |

Criação e remoção geram evento de auditoria (`ADMIN_ACCESS_CHANGE`).

## Verificação

`npm run build` em `crm-clinica-admin`. Com um super admin: criar membro (conferir e-mail sugerido, erros nos campos e senha copiável), filtrar a lista e remover um membro.
