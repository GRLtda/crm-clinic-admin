# Cabeçalho padrão de página do admin (`AppPageHeader`)

**Regra obrigatória:** toda página do admin começa com `src/components/global/AppPageHeader.vue`, com **ícone, título e subtítulo**. O padrão é o da **Auditoria do sistema** (`/audit/system`): ícone de 46×46px em quadrado arredondado azul claro (`#eff6ff`, ícone `#2563eb`, tamanho 24), título `h1` de 1.75rem e subtítulo cinza (`#64748b`, 0.9rem). Não crie `<h1>`/`<h2 class="page-title">` próprios.

## Uso

```vue
<AppPageHeader title="Clínicas" subtitle="Acompanhe as clínicas, seus planos e o status da assinatura." :icon="Building2">
  <template #actions>
    <button class="btn-primary">Ação da página</button>
  </template>
</AppPageHeader>
```

| Prop / slot | Descrição |
| --- | --- |
| `title` | Obrigatório. Nome da página (igual ao item do menu). |
| `subtitle` | Uma frase curta dizendo o que a página mostra. |
| `icon` | Obrigatório. Componente do `lucide-vue-next`. |
| slot `actions` | Botões/filtros da página, alinhados à direita (abaixo do título no celular). |

## Ícones e textos atuais

| Página | Ícone |
| --- | --- |
| Resumo Geral (`/`) | `LayoutDashboard` |
| Usuários (`/users`) | `Users` |
| Convites (`/invitations`) | `MailPlus` |
| Clínicas (`/clinics`) | `Building2` |
| Campanhas (`/campaigns`) | `Megaphone` |
| Armazenamento (`/storage`) | `HardDrive` |
| Assinaturas (`/subscriptions`) | `CreditCard` |
| Planos (`/plans`) | `Layers` |
| Equipe Admin (`/team`) | `ShieldCheck` |
| Notificações (`/notifications`) | `Bell` |
| WhatsApp (`/whatsapp`) | `MessageCircle` |
| Avaliações (`/surveys`) | `Star` |
| Lia: uso e tokens (`/lia`) | `Sparkles` |
| Lia: erros e qualidade (`/lia/quality`) | `ShieldAlert` |
| Auditoria do sistema / financeira | `ShieldCheck` / `WalletCards` |

## Exceções

- Páginas de detalhe (`/clinics/:id`, `/campaigns/:id`) têm cabeçalho próprio com botão de voltar e a identidade do registro.
- Login e troca de senha ficam fora do layout do painel.
- A aba de armazenamento dentro do detalhe da clínica (`StoragePanel` com `clinicId`) mantém o título de seção, não o de página.

## Verificação

`npm run build` em `crm-clinica-admin` e conferir que cada rota acima mostra ícone, título e subtítulo no mesmo tamanho e posição da Auditoria do sistema, inclusive no celular.
