export type Database = {
  public: {
    Tables: {
      wishlist_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: string;
          priority: string;
          link: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price: string;
          priority: string;
          link: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: string;
          priority?: string;
          link?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
