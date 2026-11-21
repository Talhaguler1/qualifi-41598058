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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      qualifi_commitments: {
        Row: {
          amount: number
          confidence: number | null
          counterparty: string
          created_at: string
          currency: string
          direction: string
          due_date: string | null
          evidence: string | null
          file_id: string | null
          id: string
          kind: string
          needs_review: boolean
          paid_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          confidence?: number | null
          counterparty: string
          created_at?: string
          currency?: string
          direction: string
          due_date?: string | null
          evidence?: string | null
          file_id?: string | null
          id?: string
          kind: string
          needs_review?: boolean
          paid_at?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          amount?: number
          confidence?: number | null
          counterparty?: string
          created_at?: string
          currency?: string
          direction?: string
          due_date?: string | null
          evidence?: string | null
          file_id?: string | null
          id?: string
          kind?: string
          needs_review?: boolean
          paid_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualifi_commitments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "qualifi_workspace_files"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifi_demo_interactions: {
        Row: {
          action: string
          created_at: string
          demo_date: string
          detail: string | null
          id: string
          panel: string
          session_id: string
          target: string | null
          tenant: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          demo_date: string
          detail?: string | null
          id?: string
          panel: string
          session_id: string
          target?: string | null
          tenant: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          demo_date?: string
          detail?: string | null
          id?: string
          panel?: string
          session_id?: string
          target?: string | null
          tenant?: string
          user_id?: string | null
        }
        Relationships: []
      }
      qualifi_events: {
        Row: {
          created_at: string
          event: string
          id: string
          locale: string
          page_id: string
          properties: Json
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id: string
          locale: string
          page_id: string
          properties?: Json
          visitor_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          locale?: string
          page_id?: string
          properties?: Json
          visitor_id?: string
        }
        Relationships: []
      }
      qualifi_leads: {
        Row: {
          analytics_consent: boolean
          campaign_id: string | null
          company: string | null
          contact_status: string
          created_at: string
          email: string
          file_mode: string
          id: string
          kind: string
          locale: string
          page_id: string
          segment: string
          solution: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          analytics_consent?: boolean
          campaign_id?: string | null
          company?: string | null
          contact_status?: string
          created_at?: string
          email: string
          file_mode?: string
          id: string
          kind: string
          locale: string
          page_id: string
          segment: string
          solution: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          analytics_consent?: boolean
          campaign_id?: string | null
          company?: string | null
          contact_status?: string
          created_at?: string
          email?: string
          file_mode?: string
          id?: string
          kind?: string
          locale?: string
          page_id?: string
          segment?: string
          solution?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      qualifi_request_outcomes: {
        Row: {
          created_at: string
          event: string
          lead_id: string
        }
        Insert: {
          created_at?: string
          event: string
          lead_id: string
        }
        Update: {
          created_at?: string
          event?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualifi_request_outcomes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "qualifi_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifi_whatsapp_messages: {
        Row: {
          ai_summary: string | null
          body: string
          commitment_id: string | null
          confidence: number | null
          contact_name: string | null
          contact_wa_id: string
          created_at: string
          delivery_status: string | null
          direction: string
          error: string | null
          id: string
          intent: string | null
          new_due_date: string | null
          previous_due_date: string | null
          reply_draft: string | null
          reply_state: string
          user_id: string
          wa_message_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          body: string
          commitment_id?: string | null
          confidence?: number | null
          contact_name?: string | null
          contact_wa_id: string
          created_at?: string
          delivery_status?: string | null
          direction: string
          error?: string | null
          id?: string
          intent?: string | null
          new_due_date?: string | null
          previous_due_date?: string | null
          reply_draft?: string | null
          reply_state?: string
          user_id: string
          wa_message_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          body?: string
          commitment_id?: string | null
          confidence?: number | null
          contact_name?: string | null
          contact_wa_id?: string
          created_at?: string
          delivery_status?: string | null
          direction?: string
          error?: string | null
          id?: string
          intent?: string | null
          new_due_date?: string | null
          previous_due_date?: string | null
          reply_draft?: string | null
          reply_state?: string
          user_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualifi_whatsapp_messages_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "qualifi_commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifi_workspace_files: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          original_name: string
          status: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          original_name: string
          status?: string
          storage_path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          original_name?: string
          status?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      qualifi_delete_my_workspace: { Args: never; Returns: Json }
      qualifi_is_admin: { Args: never; Returns: boolean }
      qualifi_save_lead: { Args: { p: Json }; Returns: Json }
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
