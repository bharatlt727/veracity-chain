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
      case_officers: {
        Row: {
          assigned_at: string
          capacity: string
          case_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          capacity?: string
          case_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          capacity?: string
          case_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_officers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          case_id: string
          created_at: string
          detail: string
          id: string
          occurred_on: string
          source: string
          title: string
        }
        Insert: {
          case_id: string
          created_at?: string
          detail?: string
          id?: string
          occurred_on: string
          source?: string
          title: string
        }
        Update: {
          case_id?: string
          created_at?: string
          detail?: string
          id?: string
          occurred_on?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          classification: Database["public"]["Enums"]["classification"]
          created_at: string
          created_by: string | null
          id: string
          office: string
          opened_on: string
          risk_score: number
          status: Database["public"]["Enums"]["case_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          case_number: string
          classification?: Database["public"]["Enums"]["classification"]
          created_at?: string
          created_by?: string | null
          id?: string
          office?: string
          opened_on?: string
          risk_score?: number
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          case_number?: string
          classification?: Database["public"]["Enums"]["classification"]
          created_at?: string
          created_by?: string | null
          id?: string
          office?: string
          opened_on?: string
          risk_score?: number
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custody_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          case_id: string | null
          evidence_id: string | null
          hash_at_event: string | null
          id: string
          occurred_at: string
          office: string
          outcome: string
          reason: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          case_id?: string | null
          evidence_id?: string | null
          hash_at_event?: string | null
          id?: string
          occurred_at?: string
          office?: string
          outcome?: string
          reason?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          case_id?: string | null
          evidence_id?: string | null
          hash_at_event?: string | null
          id?: string
          occurred_at?: string
          office?: string
          outcome?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "custody_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custody_events_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          case_id: string
          classification: Database["public"]["Enums"]["classification"]
          created_at: string
          description: string
          evidence_number: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          frozen: boolean
          id: string
          integrity_ok: boolean
          mime_type: string | null
          sha256: string
          tags: string[]
          title: string
          updated_at: string
          uploaded_by: string | null
          uploaded_office: string
          version: string
        }
        Insert: {
          case_id: string
          classification?: Database["public"]["Enums"]["classification"]
          created_at?: string
          description?: string
          evidence_number: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          frozen?: boolean
          id?: string
          integrity_ok?: boolean
          mime_type?: string | null
          sha256: string
          tags?: string[]
          title: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_office?: string
          version?: string
        }
        Update: {
          case_id?: string
          classification?: Database["public"]["Enums"]["classification"]
          created_at?: string
          description?: string
          evidence_number?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          frozen?: boolean
          id?: string
          integrity_ok?: boolean
          mime_type?: string | null
          sha256?: string
          tags?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_office?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          device: string
          id: string
          identifier: string
          ip_hint: string
          level_1_otp: boolean
          level_2_passkey: boolean
          level_3_credentials: boolean
          occurred_at: string
          result: string
          user_id: string | null
        }
        Insert: {
          device?: string
          id?: string
          identifier?: string
          ip_hint?: string
          level_1_otp?: boolean
          level_2_passkey?: boolean
          level_3_credentials?: boolean
          occurred_at?: string
          result?: string
          user_id?: string | null
        }
        Update: {
          device?: string
          id?: string
          identifier?: string
          ip_hint?: string
          level_1_otp?: boolean
          level_2_passkey?: boolean
          level_3_credentials?: boolean
          occurred_at?: string
          result?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clearance_level: number
          created_at: string
          department: string
          designation: string
          email: string
          employee_id: string
          full_name: string
          id: string
          last_login_at: string | null
          office: string
          passkey_registered: boolean
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          clearance_level?: number
          created_at?: string
          department?: string
          designation?: string
          email: string
          employee_id: string
          full_name: string
          id: string
          last_login_at?: string | null
          office?: string
          passkey_registered?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          clearance_level?: number
          created_at?: string
          department?: string
          designation?: string
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          office?: string
          passkey_registered?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      registered_devices: {
        Row: {
          created_at: string
          credential_id: string
          device_label: string
          id: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          device_label?: string
          id?: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          device_label?: string
          id?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      classification_level: {
        Args: { c: Database["public"]["Enums"]["classification"] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_clearance: { Args: never; Returns: number }
    }
    Enums: {
      account_status: "ACTIVE" | "DISABLED" | "LOCKED" | "PENDING"
      app_role: "admin" | "senior_officer" | "officer" | "auditor"
      case_status:
        | "OPEN"
        | "UNDER_INVESTIGATION"
        | "LEGAL_REVIEW"
        | "CLOSED"
        | "ARCHIVED"
      classification:
        | "PUBLIC"
        | "INTERNAL"
        | "CONFIDENTIAL"
        | "HIGHLY_CONFIDENTIAL"
        | "RESTRICTED_EVIDENCE"
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
    Enums: {
      account_status: ["ACTIVE", "DISABLED", "LOCKED", "PENDING"],
      app_role: ["admin", "senior_officer", "officer", "auditor"],
      case_status: [
        "OPEN",
        "UNDER_INVESTIGATION",
        "LEGAL_REVIEW",
        "CLOSED",
        "ARCHIVED",
      ],
      classification: [
        "PUBLIC",
        "INTERNAL",
        "CONFIDENTIAL",
        "HIGHLY_CONFIDENTIAL",
        "RESTRICTED_EVIDENCE",
      ],
    },
  },
} as const
