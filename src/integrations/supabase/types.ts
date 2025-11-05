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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      floors: {
        Row: {
          created_at: string | null
          display_name: string
          floor_number: string
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          floor_number: string
          id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          floor_number?: string
          id?: string
        }
        Relationships: []
      }
      item_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          item_id: string
          room_id: string
          status: Database["public"]["Enums"]["item_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          item_id: string
          room_id: string
          status?: Database["public"]["Enums"]["item_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          item_id?: string
          room_id?: string
          status?: Database["public"]["Enums"]["item_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      item_transfers: {
        Row: {
          assignment_id: string
          from_room_id: string
          id: string
          reason: string | null
          to_room_id: string
          transferred_at: string | null
        }
        Insert: {
          assignment_id: string
          from_room_id: string
          id?: string
          reason?: string | null
          to_room_id: string
          transferred_at?: string | null
        }
        Update: {
          assignment_id?: string
          from_room_id?: string
          id?: string
          reason?: string | null
          to_room_id?: string
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_transfers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "item_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_transfers_from_room_id_fkey"
            columns: ["from_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_transfers_to_room_id_fkey"
            columns: ["to_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          item_type: string
          quantity_assigned: number
          quantity_total: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_type: string
          quantity_assigned?: number
          quantity_total?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_type?: string
          quantity_assigned?: number
          quantity_total?: number
        }
        Relationships: []
      }
      needed_items: {
        Row: {
          description: string | null
          fulfilled: boolean
          id: string
          item_type: string
          notes: string | null
          quantity: number
          requested_at: string
          room_id: string
        }
        Insert: {
          description?: string | null
          fulfilled?: boolean
          id?: string
          item_type: string
          notes?: string | null
          quantity?: number
          requested_at?: string
          room_id: string
        }
        Update: {
          description?: string | null
          fulfilled?: boolean
          id?: string
          item_type?: string
          notes?: string | null
          quantity?: number
          requested_at?: string
          room_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string | null
          floor_id: string
          id: string
          room_number: string
        }
        Insert: {
          created_at?: string | null
          floor_id: string
          id?: string
          room_number: string
        }
        Update: {
          created_at?: string | null
          floor_id?: string
          id?: string
          room_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_status: "building" | "built" | "delivering" | "in_room"
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
      item_status: ["building", "built", "delivering", "in_room"],
    },
  },
} as const
