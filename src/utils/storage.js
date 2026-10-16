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
  `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((bytes || 0) / 1024 ** 3)} GB`;
export const formatSize = (bytes) => {
  const value = Math.max(0, Number(bytes) || 0);
  if (value >= 1024 ** 3) return formatGB(value);
  const unit = value >= 1024 ** 2 ? "MB" : value >= 1024 ? "KB" : "B";
  const divisor = { MB: 1024 ** 2, KB: 1024, B: 1 }[unit];
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value / divisor)} ${unit}`;
};
export const storageError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  "Não foi possível consultar o armazenamento. Tente novamente.";
