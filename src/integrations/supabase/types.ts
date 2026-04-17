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
      categories: {
        Row: {
          created_at: string
          display_order: number
          hide_featured: boolean
          id: string
          name: string
          parent_id: string | null
          show_in_menu: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          hide_featured?: boolean
          id?: string
          name: string
          parent_id?: string | null
          show_in_menu?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          hide_featured?: boolean
          id?: string
          name?: string
          parent_id?: string | null
          show_in_menu?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          bn_name: string
          created_at: string
          display_order: number
          division_id: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          bn_name: string
          created_at?: string
          display_order?: number
          division_id: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          bn_name?: string
          created_at?: string
          display_order?: number
          division_id?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          bn_name: string
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          bn_name: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          bn_name?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          category_id: string | null
          config: Json
          created_at: string
          display_order: number
          division_id: string | null
          id: string
          is_visible: boolean
          item_count: number
          section_type: string
          title: string
          updated_at: string
          variant: string
        }
        Insert: {
          category_id?: string | null
          config?: Json
          created_at?: string
          display_order?: number
          division_id?: string | null
          id?: string
          is_visible?: boolean
          item_count?: number
          section_type?: string
          title: string
          updated_at?: string
          variant?: string
        }
        Update: {
          category_id?: string | null
          config?: Json
          created_at?: string
          display_order?: number
          division_id?: string | null
          id?: string
          is_visible?: boolean
          item_count?: number
          section_type?: string
          title?: string
          updated_at?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_sections_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      photocards: {
        Row: {
          card_size: string
          category_id: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          quote: string | null
          source_url: string | null
        }
        Insert: {
          card_size?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          quote?: string | null
          source_url?: string | null
        }
        Update: {
          card_size?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          quote?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          viewed_at: string
          visitor_hash: string | null
        }
        Insert: {
          id?: string
          post_id: string
          viewed_at?: string
          visitor_hash?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          viewed_at?: string
          visitor_hash?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          district_id: string | null
          division_id: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          post_type: Database["public"]["Enums"]["post_type"]
          published_at: string
          slug: string
          source_id: string | null
          source_url: string | null
          title: string
          upazila_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          district_id?: string | null
          division_id?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          post_type?: Database["public"]["Enums"]["post_type"]
          published_at?: string
          slug: string
          source_id?: string | null
          source_url?: string | null
          title: string
          upazila_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          district_id?: string | null
          division_id?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          post_type?: Database["public"]["Enums"]["post_type"]
          published_at?: string
          slug?: string
          source_id?: string | null
          source_url?: string | null
          title?: string
          upazila_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scraper_configs: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          interval_minutes: number
          is_active: boolean
          last_error: string | null
          last_run_at: string | null
          method: Database["public"]["Enums"]["scraper_method"]
          source_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          method?: Database["public"]["Enums"]["scraper_method"]
          source_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          method?: Database["public"]["Enums"]["scraper_method"]
          source_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraper_configs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraper_configs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          accent_hue: number
          accent_lightness: number
          accent_saturation: number
          base_font_size: number
          body_font: string
          headline_font: string
          headline_weight: number
          home_theme: string
          id: number
          logo_url: string | null
          og_image_url: string | null
          primary_hue: number
          primary_lightness: number
          primary_saturation: number
          show_breaking_ticker: boolean
          show_divisions_tabs: boolean
          show_hero_block: boolean
          show_latest_section: boolean
          site_description: string
          site_name: string
          updated_at: string
        }
        Insert: {
          accent_hue?: number
          accent_lightness?: number
          accent_saturation?: number
          base_font_size?: number
          body_font?: string
          headline_font?: string
          headline_weight?: number
          home_theme?: string
          id?: number
          logo_url?: string | null
          og_image_url?: string | null
          primary_hue?: number
          primary_lightness?: number
          primary_saturation?: number
          show_breaking_ticker?: boolean
          show_divisions_tabs?: boolean
          show_hero_block?: boolean
          show_latest_section?: boolean
          site_description?: string
          site_name?: string
          updated_at?: string
        }
        Update: {
          accent_hue?: number
          accent_lightness?: number
          accent_saturation?: number
          base_font_size?: number
          body_font?: string
          headline_font?: string
          headline_weight?: number
          home_theme?: string
          id?: number
          logo_url?: string | null
          og_image_url?: string | null
          primary_hue?: number
          primary_lightness?: number
          primary_saturation?: number
          show_breaking_ticker?: boolean
          show_divisions_tabs?: boolean
          show_hero_block?: boolean
          show_latest_section?: boolean
          site_description?: string
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      upazilas: {
        Row: {
          bn_name: string
          created_at: string
          display_order: number
          district_id: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          bn_name: string
          created_at?: string
          display_order?: number
          district_id: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          bn_name?: string
          created_at?: string
          display_order?: number
          district_id?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upazilas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_popular_posts: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          id: string
          image_url: string
          published_at: string
          slug: string
          title: string
          view_count: number
        }[]
      }
      get_post_view_count: { Args: { _post_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      post_type: "auto" | "manual"
      scraper_method: "rss" | "firecrawl"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "user"],
      post_type: ["auto", "manual"],
      scraper_method: ["rss", "firecrawl"],
    },
  },
} as const
