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
      conversation_memory: {
        Row: {
          messages: Json
          phone: string
          store_id: number
          updated_at: string
        }
        Insert: {
          messages?: Json
          phone: string
          store_id: number
          updated_at?: string
        }
        Update: {
          messages?: Json
          phone?: string
          store_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      message_buffer: {
        Row: {
          chat_id: string
          conversation_data: Json
          created_at: string
          last_message: string
          messages: Json
          phone: string
          process_after: string
          store_id: number | null
        }
        Insert: {
          chat_id: string
          conversation_data: Json
          created_at?: string
          last_message?: string
          messages?: Json
          phone: string
          process_after: string
          store_id?: number | null
        }
        Update: {
          chat_id?: string
          conversation_data?: Json
          created_at?: string
          last_message?: string
          messages?: Json
          phone?: string
          process_after?: string
          store_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_buffer_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean
          bot_session: string
          id: number
          inbox_id: number
          slug: string
          support_label: string
          support_notify_chat: string
          support_session: string
          system_prompt: string
          waha_url: string
        }
        Insert: {
          active?: boolean
          bot_session: string
          id?: number
          inbox_id: number
          slug: string
          support_label: string
          support_notify_chat: string
          support_session: string
          system_prompt: string
          waha_url: string
        }
        Update: {
          active?: boolean
          bot_session?: string
          id?: number
          inbox_id?: number
          slug?: string
          support_label?: string
          support_notify_chat?: string
          support_session?: string
          system_prompt?: string
          waha_url?: string
        }
        Relationships: []
      }
      transfer_flow_audit: {
        Row: {
          detail: Json | null
          id: number
          source_id: string | null
          step: string
          store_id: number | null
          telefone: string | null
          ts: string
          vendor: string | null
        }
        Insert: {
          detail?: Json | null
          id?: number
          source_id?: string | null
          step: string
          store_id?: number | null
          telefone?: string | null
          ts?: string
          vendor?: string | null
        }
        Update: {
          detail?: Json | null
          id?: number
          source_id?: string | null
          step?: string
          store_id?: number | null
          telefone?: string | null
          ts?: string
          vendor?: string | null
        }
        Relationships: []
      }
      transfer_locks: {
        Row: {
          created_at: string
          expires_at: string
          source_id: string
          store_id: number | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          source_id: string
          store_id?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          source_id?: string
          store_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_locks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_queue: {
        Row: {
          current_vendor: string
          id: number
          store_id: number | null
        }
        Insert: {
          current_vendor?: string
          id?: number
          store_id?: number | null
        }
        Update: {
          current_vendor?: string
          id?: number
          store_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_queue_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          active: boolean
          greeting: string
          greeting_off: string
          id: number
          label: string
          name: string
          queue_order: number | null
          store_id: number
          summary_chat: string | null
          waha_session: string
        }
        Insert: {
          active?: boolean
          greeting: string
          greeting_off: string
          id?: number
          label: string
          name: string
          queue_order?: number | null
          store_id: number
          summary_chat?: string | null
          waha_session: string
        }
        Update: {
          active?: boolean
          greeting?: string
          greeting_off?: string
          id?: number
          label?: string
          name?: string
          queue_order?: number | null
          store_id?: number
          summary_chat?: string | null
          waha_session?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_transfer_lock: {
        Args: { p_source_id: string; p_store_id: number }
        Returns: boolean
      }
      pop_ready_messages: {
        Args: { p_limit?: number }
        Returns: {
          chat_id: string
          conversation_data: Json
          created_at: string
          last_message: string
          messages: Json
          phone: string
          process_after: string
          store_id: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "message_buffer"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pop_specific_chat: {
        Args: { p_chat_id: string }
        Returns: {
          chat_id: string
          conversation_data: Json
          messages: Json
          phone: string
          store_id: number
        }[]
      }
      upsert_message_buffer: {
        Args: {
          p_conversation_data: Json
          p_message: string
          p_phone: string
          p_store_id?: number
          p_waha_id: string
        }
        Returns: undefined
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
    Enums: {},
  },
} as const
