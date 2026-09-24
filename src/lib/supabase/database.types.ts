export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      my_carrier_memberships: {
        Row: {
          active: boolean | null
          carrier_id: string | null
          created_at: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          carrier_id?: string | null
          created_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          carrier_id?: string | null
          created_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_memberships_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_memberships_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      my_carrier_private_details: {
        Row: {
          business_kind: string | null
          carrier_id: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          legal_name: string | null
          postcode: string | null
          registration_country: string | null
          registration_number: string | null
          street: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          business_kind?: string | null
          carrier_id?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          legal_name?: string | null
          postcode?: string | null
          registration_country?: string | null
          registration_number?: string | null
          street?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          business_kind?: string | null
          carrier_id?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          legal_name?: string | null
          postcode?: string | null
          registration_country?: string | null
          registration_number?: string | null
          street?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_private_details_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: true
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_private_details_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: true
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      my_carrier_verifications: {
        Row: {
          carrier_id: string | null
          category: string | null
          created_at: string | null
          evidence_bucket: string | null
          evidence_key: string | null
          expires_at: string | null
          id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          carrier_id?: string | null
          category?: string | null
          created_at?: string | null
          evidence_bucket?: string | null
          evidence_key?: string | null
          expires_at?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier_id?: string | null
          category?: string | null
          created_at?: string | null
          evidence_bucket?: string | null
          evidence_key?: string | null
          expires_at?: string | null
          id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_verifications_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_verifications_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      my_carriers: {
        Row: {
          cmr_insurance_available: boolean | null
          description: string | null
          display_name: string | null
          id: string | null
          invoice_available: boolean | null
          live_tracking_available: boolean | null
          registration_country: string | null
          service_countries: string[] | null
          slug: string | null
          suspended_at: string | null
          visibility: string | null
        }
        Insert: {
          cmr_insurance_available?: boolean | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          invoice_available?: boolean | null
          live_tracking_available?: boolean | null
          registration_country?: string | null
          service_countries?: string[] | null
          slug?: string | null
          suspended_at?: string | null
          visibility?: string | null
        }
        Update: {
          cmr_insurance_available?: boolean | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          invoice_available?: boolean | null
          live_tracking_available?: boolean | null
          registration_country?: string | null
          service_countries?: string[] | null
          slug?: string | null
          suspended_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      my_platform_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          revoked_at: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          revoked_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          revoked_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      my_profile: {
        Row: {
          account_status: string | null
          beta_access: boolean | null
          contact_email: string | null
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email_verified_at: string | null
          id: string | null
          phone_e164: string | null
          phone_verified_at: string | null
          preferred_locale: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          beta_access?: boolean | null
          contact_email?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email_verified_at?: string | null
          id?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          beta_access?: boolean | null
          contact_email?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email_verified_at?: string | null
          id?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_carriers: {
        Row: {
          cmr_insurance_available: boolean | null
          description: string | null
          display_name: string | null
          id: string | null
          invoice_available: boolean | null
          live_tracking_available: boolean | null
          registration_country: string | null
          service_countries: string[] | null
          slug: string | null
        }
        Insert: {
          cmr_insurance_available?: boolean | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          invoice_available?: boolean | null
          live_tracking_available?: boolean | null
          registration_country?: string | null
          service_countries?: string[] | null
          slug?: string | null
        }
        Update: {
          cmr_insurance_available?: boolean | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          invoice_available?: boolean | null
          live_tracking_available?: boolean | null
          registration_country?: string | null
          service_countries?: string[] | null
          slug?: string | null
        }
        Relationships: []
      }
      public_locations: {
        Row: {
          city: string | null
          country_code: string | null
          country_name: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          slug: string | null
          time_zone: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          slug?: string | null
          time_zone?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          slug?: string | null
          time_zone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_carrier: {
        Args: {
          p_business_kind: string
          p_display_name: string
          p_legal_name: string
          p_registration_country: string
          p_slug: string
        }
        Returns: string
      }
      update_my_carrier: {
        Args: {
          p_carrier_id: string
          p_cmr_insurance_available: boolean
          p_description: string
          p_display_name: string
          p_invoice_available: boolean
          p_live_tracking_available: boolean
          p_service_countries: string[]
        }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          p_contact_email: string
          p_display_name: string
          p_preferred_locale: string
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
  app: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          change_summary: Json
          correlation_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          change_summary: Json
          correlation_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          change_summary?: Json
          correlation_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_memberships: {
        Row: {
          active: boolean
          carrier_id: string
          created_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          carrier_id: string
          created_at?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          carrier_id?: string
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_memberships_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_private_details: {
        Row: {
          business_kind: string
          carrier_id: string
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          legal_name: string
          postcode: string | null
          registration_country: string
          registration_number: string | null
          street: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          business_kind: string
          carrier_id: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          legal_name: string
          postcode?: string | null
          registration_country: string
          registration_number?: string | null
          street?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          business_kind?: string
          carrier_id?: string
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          legal_name?: string
          postcode?: string | null
          registration_country?: string
          registration_number?: string | null
          street?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_private_details_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: true
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_verifications: {
        Row: {
          carrier_id: string
          category: string
          coverage_amount: number | null
          coverage_currency: string | null
          created_at: string
          decision_reason: string | null
          evidence_bucket: string | null
          evidence_key: string | null
          expires_at: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          carrier_id: string
          category: string
          coverage_amount?: number | null
          coverage_currency?: string | null
          created_at?: string
          decision_reason?: string | null
          evidence_bucket?: string | null
          evidence_key?: string | null
          expires_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          carrier_id?: string
          category?: string
          coverage_amount?: number | null
          coverage_currency?: string | null
          created_at?: string
          decision_reason?: string | null
          evidence_bucket?: string | null
          evidence_key?: string | null
          expires_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_verifications_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          cmr_insurance_available: boolean
          created_at: string
          description: string
          display_name: string
          id: string
          invoice_available: boolean
          live_tracking_available: boolean
          registration_country: string | null
          service_countries: string[]
          slug: string
          suspended_at: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          cmr_insurance_available?: boolean
          created_at?: string
          description?: string
          display_name: string
          id?: string
          invoice_available?: boolean
          live_tracking_available?: boolean
          registration_country?: string | null
          service_countries?: string[]
          slug: string
          suspended_at?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          cmr_insurance_available?: boolean
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          invoice_available?: boolean
          live_tracking_available?: boolean
          registration_country?: string | null
          service_countries?: string[]
          slug?: string
          suspended_at?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          revoked_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          beta_access: boolean
          contact_email: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          email_verified_at: string | null
          id: string
          phone_e164: string | null
          phone_verified_at: string | null
          preferred_locale: string
          updated_at: string
        }
        Insert: {
          account_status?: string
          beta_access?: boolean
          contact_email?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email_verified_at?: string | null
          id: string
          phone_e164?: string | null
          phone_verified_at?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Update: {
          account_status?: string
          beta_access?: boolean
          contact_email?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email_verified_at?: string | null
          id?: string
          phone_e164?: string | null
          phone_verified_at?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_locations: {
        Row: {
          city: string
          country_code: string
          country_name: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          provider_place_id: string | null
          region: string | null
          slug: string
          time_zone: string
          updated_at: string
        }
        Insert: {
          city: string
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_place_id?: string | null
          region?: string | null
          slug: string
          time_zone: string
          updated_at?: string
        }
        Update: {
          city?: string
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider_place_id?: string | null
          region?: string | null
          slug?: string
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  api: {
    Enums: {},
  },
  app: {
    Enums: {},
  },
} as const

