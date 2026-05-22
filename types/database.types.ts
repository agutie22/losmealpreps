export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_secrets: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bundles: {
        Row: {
          base_price_cents: number
          display_name: string
          hero_image_url: string | null
          id: string
          is_active: boolean
          per_slot_savings_cents: number
          slot_count: number
          tagline: string | null
          tier: string
        }
        Insert: {
          base_price_cents: number
          display_name: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          per_slot_savings_cents?: number
          slot_count: number
          tagline?: string | null
          tier: string
        }
        Update: {
          base_price_cents?: number
          display_name?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          per_slot_savings_cents?: number
          slot_count?: number
          tagline?: string | null
          tier?: string
        }
        Relationships: []
      }
      custom_meal_config: {
        Row: {
          base_price_cents: number
          id: number
          included_sauce_count: number
          included_veggie_count: number
          max_veggie_count: number
          updated_at: string
        }
        Insert: {
          base_price_cents: number
          id?: number
          included_sauce_count?: number
          included_veggie_count?: number
          max_veggie_count?: number
          updated_at?: string
        }
        Update: {
          base_price_cents?: number
          id?: number
          included_sauce_count?: number
          included_veggie_count?: number
          max_veggie_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      deploy_triggers: {
        Row: {
          id: string
          triggered_at: string | null
          triggered_by: string
        }
        Insert: {
          id?: string
          triggered_at?: string | null
          triggered_by: string
        }
        Update: {
          id?: string
          triggered_at?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      dietary_tags: {
        Row: {
          color_token: string | null
          display_order: number
          icon_name: string | null
          id: string
          label: string
          short_label: string | null
          slug: string
        }
        Insert: {
          color_token?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          label: string
          short_label?: string | null
          slug: string
        }
        Update: {
          color_token?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          label?: string
          short_label?: string | null
          slug?: string
        }
        Relationships: []
      }
      ingredient_variants: {
        Row: {
          calories: number
          carbs_g: number
          display_order: number
          fat_g: number
          id: string
          ingredient_id: string
          is_default: boolean
          price_cents: number
          protein_g: number
          size_label: string
        }
        Insert: {
          calories: number
          carbs_g: number
          display_order?: number
          fat_g: number
          id?: string
          ingredient_id: string
          is_default?: boolean
          price_cents: number
          protein_g: number
          size_label: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          display_order?: number
          fat_g?: number
          id?: string
          ingredient_id?: string
          is_default?: boolean
          price_cents?: number
          protein_g?: number
          size_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_variants_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          available_as_side: boolean
          calories: number
          carbs_g: number
          created_at: string
          display_order: number
          fat_g: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          protein_g: number
          type: string
          upcharge_cents: number
        }
        Insert: {
          available_as_side?: boolean
          calories?: number
          carbs_g?: number
          created_at?: string
          display_order?: number
          fat_g?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          protein_g?: number
          type: string
          upcharge_cents?: number
        }
        Update: {
          available_as_side?: boolean
          calories?: number
          carbs_g?: number
          created_at?: string
          display_order?: number
          fat_g?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          protein_g?: number
          type?: string
          upcharge_cents?: number
        }
        Relationships: []
      }
      meal_default_ingredients: {
        Row: {
          ingredient_id: string
          meal_id: string
        }
        Insert: {
          ingredient_id: string
          meal_id: string
        }
        Update: {
          ingredient_id?: string
          meal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_default_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_default_ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_dietary_tags: {
        Row: {
          meal_id: string
          tag_id: string
        }
        Insert: {
          meal_id: string
          tag_id: string
        }
        Update: {
          meal_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_dietary_tags_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_dietary_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "dietary_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_swap_options: {
        Row: {
          ingredient_id: string
          meal_id: string
        }
        Insert: {
          ingredient_id: string
          meal_id: string
        }
        Update: {
          ingredient_id?: string
          meal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_swap_options_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_swap_options_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          base_price_cents: number
          calories: number
          carbs_g: number
          category: string
          created_at: string
          description: string
          display_order: number
          fat_g: number
          hero_image_url: string
          id: string
          is_active: boolean
          is_featured: boolean
          meal_type: string
          name: string
          protein_g: number
          rating: number | null
          rating_count: number | null
          slug: string
        }
        Insert: {
          base_price_cents: number
          calories?: number
          carbs_g?: number
          category: string
          created_at?: string
          description: string
          display_order?: number
          fat_g?: number
          hero_image_url: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          meal_type?: string
          name: string
          protein_g?: number
          rating?: number | null
          rating_count?: number | null
          slug: string
        }
        Update: {
          base_price_cents?: number
          calories?: number
          carbs_g?: number
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          fat_g?: number
          hero_image_url?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          meal_type?: string
          name?: string
          protein_g?: number
          rating?: number | null
          rating_count?: number | null
          slug?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { user_email: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

