export const storageLabels = {
  imagens: "Imagens",
  documentos: "Documentos",
  assinaturas: "Assinaturas",
  branding: "Identidade visual",
  perfil: "Fotos de perfil",
  outros: "Outros",
  other: "Outros",
};
export const categoryLabel = (value) => storageLabels[value] || value;
export const formatGB = (bytes) =>
  `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format((bytes || 0) / 1024 ** 3)} GB`;
export const formatSize = (bytes) =>
  bytes >= 1024 ** 3
    ? formatGB(bytes)
    : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format((bytes || 0) / 1024 ** 2)} MB`;
export const storageError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  "Não foi possível consultar o armazenamento. Tente novamente.";
