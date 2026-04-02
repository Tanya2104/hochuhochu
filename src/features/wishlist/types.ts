export type WishlistPriority = 'nice' | 'love' | 'urgent' | 'cute';

export type WishlistItem = {
  id: string;
  title: string;
  description: string;
  price: string;
  priority: WishlistPriority;
  link: string;
};
