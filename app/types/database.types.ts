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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adv: {
        Row: {
          active: string | null
          id: number
          progress: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: string | null
          id?: number
          progress?: Json | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          active?: string | null
          id?: number
          progress?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diary: {
        Row: {
          content: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      google_photos_urls: {
        Row: {
          created_at: string
          direct_url: string
          id: number
          share_url: string
        }
        Insert: {
          created_at?: string
          direct_url: string
          id?: number
          share_url: string
        }
        Update: {
          created_at?: string
          direct_url?: string
          id?: number
          share_url?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          expires_at: string | null
          id: number
          starts_at: string | null
          used: boolean
        }
        Insert: {
          code: string
          expires_at?: string | null
          id?: number
          starts_at?: string | null
          used?: boolean
        }
        Update: {
          code?: string
          expires_at?: string | null
          id?: number
          starts_at?: string | null
          used?: boolean
        }
        Relationships: []
      }
      kakeibo: {
        Row: {
          amount: number
          category: number | null
          currency: string
          date: string
          id: number
          note: string | null
          shop: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: number | null
          currency?: string
          date: string
          id?: number
          note?: string | null
          shop?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          category?: number | null
          currency?: string
          date?: string
          id?: number
          note?: string | null
          shop?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kakeibo_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "kakeibo_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kakeibo_categories: {
        Row: {
          id: number
          label: string
          order: number | null
          parent: number | null
        }
        Insert: {
          id?: number
          label: string
          order?: number | null
          parent?: number | null
        }
        Update: {
          id?: number
          label?: string
          order?: number | null
          parent?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: number
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          id: number
          name: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          id?: number
          name: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      updates: {
        Row: {
          content: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
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
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      verify_password: { Args: { password: string }; Returns: boolean }
    }
    Enums: {
      app_permission:
        | "posts.select"
        | "posts.insert"
        | "posts.update"
        | "posts.delete"
        | "kakeibo_categories.select"
        | "kakeibo_categories.insert"
        | "kakeibo_categories.update"
        | "kakeibo_categories.delete"
        | "diary.select"
        | "diary.insert"
        | "diary.update"
        | "diary.delete"
      app_role: "admin" | "guest"
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
      app_permission: [
        "posts.select",
        "posts.insert",
        "posts.update",
        "posts.delete",
        "kakeibo_categories.select",
        "kakeibo_categories.insert",
        "kakeibo_categories.update",
        "kakeibo_categories.delete",
        "diary.select",
        "diary.insert",
        "diary.update",
        "diary.delete",
      ],
      app_role: ["admin", "guest"],
    },
  },
} as const
