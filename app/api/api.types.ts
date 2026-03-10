export interface NextItem {
  id?: number | string;
  title?: string;
  slug?: string;
  /** slug категории для URL услуг: /services/{categorySlug}/{slug} */
  categorySlug?: string;
}
