export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      book_reviews: {
        Row: {
          book_id: string
          created_at: string
          id: string
          rating: number
          review: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          rating: number
          review: string
          updated_at?: string
          user_id?: string
          username: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          created_at: string
          description: string
          format: string
          genre: string
          id: string
          image_url: string
          is_active: boolean
          page_count: number
          price: string
          publication_date: string
          publisher: string
          sales_count: number | null
          stock_quantity: number
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          created_at?: string
          description: string
          format: string
          genre: string
          id?: string
          image_url: string
          is_active: boolean
          page_count: number
          price: string
          publication_date: string
          publisher: string
          sales_count?: number | null
          stock_quantity: number
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          created_at?: string
          description?: string
          format?: string
          genre?: string
          id?: string
          image_url?: string
          is_active?: boolean
          page_count?: number
          price?: string
          publication_date?: string
          publisher?: string
          sales_count?: number | null
          stock_quantity?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          end_date: string
          id?: string
          is_active: boolean
          start_date?: string
          type?: string
          updated_at?: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      order_discounts: {
        Row: {
          discount_id: string
          id: string
          order_id: string
        }
        Insert: {
          discount_id: string
          id?: string
          order_id: string
        }
        Update: {
          discount_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_discounts_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          book_id: string
          created_at: string
          id: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          payment_method: string
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_method: string
          status?: string
          total_amount: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      shopping_cart_items: {
        Row: {
          book_id: string
          cart_id: string
          created_at: string
          id: number
          quantity: number
          updated_at: string
        }
        Insert: {
          book_id?: string
          cart_id?: string
          created_at?: string
          id?: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          book_id?: string
          cart_id?: string
          created_at?: string
          id?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_cart_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          are_reviews_public: boolean
          city: string
          country: string
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          is_profile_public: boolean
          is_wishlist_public: boolean
          last_name: string
          phone_number: string
          postcode: string
          street_address: string
          updated_at: string
          username: string
          wishlist_share_token: string | null
        }
        Insert: {
          are_reviews_public?: boolean
          city: string
          country: string
          created_at?: string
          date_of_birth: string
          first_name: string
          id: string
          is_profile_public?: boolean
          is_wishlist_public?: boolean
          last_name: string
          phone_number: string
          postcode: string
          street_address: string
          updated_at?: string
          username: string
          wishlist_share_token?: string | null
        }
        Update: {
          are_reviews_public?: boolean
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          is_profile_public?: boolean
          is_wishlist_public?: boolean
          last_name?: string
          phone_number?: string
          postcode?: string
          street_address?: string
          updated_at?: string
          username?: string
          wishlist_share_token?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          book_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      books_with_stats: {
        Row: {
          author: string | null
          avg_rating: number | null
          created_at: string | null
          description: string | null
          format: string | null
          genre: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          page_count: number | null
          price: string | null
          publication_date: string | null
          publisher: string | null
          review_count: number | null
          sales_count: number | null
          stock_quantity: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_profile: {
        Args: { target_username: string }
        Returns: {
          are_reviews_public: boolean
          created_at: string
          is_profile_public: boolean
          is_wishlist_public: boolean
          username: string
        }[]
      }
      get_related_books: {
        Args: { limit_count?: number; target_book_id: string }
        Returns: {
          author: string | null
          avg_rating: number | null
          created_at: string | null
          description: string | null
          format: string | null
          genre: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          page_count: number | null
          price: string | null
          publication_date: string | null
          publisher: string | null
          review_count: number | null
          sales_count: number | null
          stock_quantity: number | null
          title: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "books_with_stats"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_profile: {
        Args: { target_username: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          id: string
          is_profile_public: boolean
          updated_at: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
