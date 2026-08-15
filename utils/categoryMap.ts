export const CATEGORY_MAP = {
  Men: ["agbada", "kaftan", "senator", "African print", "shirt & trouser"],
  Women: ["Boubu long dress", "bobu dress & skirt/Rapper", "Yoruba or Alata style", "kids"],
  HatCap: ["Hausa", "Yoruba"],
  Embroidery: [" men", "women"],
} as const;

export type CategoryKey = keyof typeof CATEGORY_MAP;
export type Subcategory = (typeof CATEGORY_MAP)[CategoryKey][number];
