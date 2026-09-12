export interface NextItem {
  id?: number | string;
  title?: string;
  slug?: string;
  /** Slug категории для URL услуги при наличии нескольких категорий. */
  categorySlug?: string;
}
