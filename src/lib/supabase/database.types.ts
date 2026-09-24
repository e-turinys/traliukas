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
      marketplace_requests: {
        Row: {
          budget_amount: number | null
          budget_currency: string | null
          default_delivery_location_id: string | null
          default_pickup_location_id: string | null
          id: string | null
          notes: string | null
          pickup_anchor_date: string | null
          pickup_flexible_option: string | null
          pickup_from: string | null
          pickup_kind: string | null
          pickup_to: string | null
          published_at: string | null
          request_version: number | null
          target_carrier_id: string | null
          visibility: string | null
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string | null
          default_delivery_location_id?: string | null
          default_pickup_location_id?: string | null
          id?: string | null
          notes?: string | null
          pickup_anchor_date?: string | null
          pickup_flexible_option?: string | null
          pickup_from?: string | null
          pickup_kind?: string | null
          pickup_to?: string | null
          published_at?: string | null
          request_version?: number | null
          target_carrier_id?: string | null
          visibility?: string | null
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string | null
          default_delivery_location_id?: string | null
          default_pickup_location_id?: string | null
          id?: string | null
          notes?: string | null
          pickup_anchor_date?: string | null
          pickup_flexible_option?: string | null
          pickup_from?: string | null
          pickup_kind?: string | null
          pickup_to?: string | null
          published_at?: string | null
          request_version?: number | null
          target_carrier_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_default_delivery_location_id_fkey"
            columns: ["default_delivery_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_default_pickup_location_id_fkey"
            columns: ["default_pickup_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_target_carrier_id_fkey"
            columns: ["target_carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_target_carrier_id_fkey"
            columns: ["target_carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      my_request_private_details: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country_code: string | null
          instructions: string | null
          postcode: string | null
          side: string | null
          street: string | null
          vehicle_id: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country_code?: string | null
          instructions?: string | null
          postcode?: string | null
          side?: string | null
          street?: string | null
          vehicle_id?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country_code?: string | null
          instructions?: string | null
          postcode?: string | null
          side?: string | null
          street?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_vehicle_private_details_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "my_request_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicle_private_details_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "request_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      my_request_vehicles: {
        Row: {
          category: string | null
          condition: string | null
          delivery_location_id: string | null
          id: string | null
          make: string | null
          model: string | null
          pickup_location_id: string | null
          position: number | null
          request_id: string | null
          rolling_ability: string | null
          uses_default_route: boolean | null
          year: number | null
        }
        Insert: {
          category?: string | null
          condition?: string | null
          delivery_location_id?: string | null
          id?: string | null
          make?: string | null
          model?: string | null
          pickup_location_id?: string | null
          position?: number | null
          request_id?: string | null
          rolling_ability?: string | null
          uses_default_route?: boolean | null
          year?: number | null
        }
        Update: {
          category?: string | null
          condition?: string | null
          delivery_location_id?: string | null
          id?: string | null
          make?: string | null
          model?: string | null
          pickup_location_id?: string | null
          position?: number | null
          request_id?: string | null
          rolling_ability?: string | null
          uses_default_route?: boolean | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_vehicles_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "my_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      my_requests: {
        Row: {
          budget_amount: number | null
          budget_currency: string | null
          created_at: string | null
          default_delivery_location_id: string | null
          default_pickup_location_id: string | null
          id: string | null
          notes: string | null
          pickup_anchor_date: string | null
          pickup_flexible_option: string | null
          pickup_from: string | null
          pickup_kind: string | null
          pickup_to: string | null
          published_at: string | null
          request_version: number | null
          status: string | null
          visibility: string | null
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string | null
          default_delivery_location_id?: string | null
          default_pickup_location_id?: string | null
          id?: string | null
          notes?: string | null
          pickup_anchor_date?: string | null
          pickup_flexible_option?: string | null
          pickup_from?: string | null
          pickup_kind?: string | null
          pickup_to?: string | null
          published_at?: string | null
          request_version?: number | null
          status?: string | null
          visibility?: string | null
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string | null
          default_delivery_location_id?: string | null
          default_pickup_location_id?: string | null
          id?: string | null
          notes?: string | null
          pickup_anchor_date?: string | null
          pickup_flexible_option?: string | null
          pickup_from?: string | null
          pickup_kind?: string | null
          pickup_to?: string | null
          published_at?: string | null
          request_version?: number | null
          status?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_default_delivery_location_id_fkey"
            columns: ["default_delivery_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_default_pickup_location_id_fkey"
            columns: ["default_pickup_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
        ]
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
      request_vehicles: {
        Row: {
          category: string | null
          condition: string | null
          delivery_location_id: string | null
          id: string | null
          make: string | null
          model: string | null
          pickup_location_id: string | null
          position: number | null
          request_id: string | null
          rolling_ability: string | null
          year: number | null
        }
        Insert: {
          category?: string | null
          condition?: string | null
          delivery_location_id?: string | null
          id?: string | null
          make?: string | null
          model?: string | null
          pickup_location_id?: string | null
          position?: number | null
          request_id?: string | null
          rolling_ability?: string | null
          year?: number | null
        }
        Update: {
          category?: string | null
          condition?: string | null
          delivery_location_id?: string | null
          id?: string | null
          make?: string | null
          model?: string | null
          pickup_location_id?: string | null
          position?: number | null
          request_id?: string | null
          rolling_ability?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_vehicles_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "my_requests"
            referencedColumns: ["id"]
          },
        ]
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
      publish_request: {
        Args: { p_client_publish_key: string; p_payload: Json }
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
      request_revisions: {
        Row: {
          changed_by: string
          created_at: string
          public_terms_snapshot: Json
          request_id: string
          snapshot_schema_version: number
          version: number
        }
        Insert: {
          changed_by: string
          created_at?: string
          public_terms_snapshot: Json
          request_id: string
          snapshot_schema_version?: number
          version: number
        }
        Update: {
          changed_by?: string
          created_at?: string
          public_terms_snapshot?: Json
          request_id?: string
          snapshot_schema_version?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_revisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_vehicle_private_details: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country_code: string | null
          created_at: string
          instructions: string | null
          postcode: string | null
          side: string
          street: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country_code?: string | null
          created_at?: string
          instructions?: string | null
          postcode?: string | null
          side: string
          street?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country_code?: string | null
          created_at?: string
          instructions?: string | null
          postcode?: string | null
          side?: string
          street?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_vehicle_private_details_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "request_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_vehicles: {
        Row: {
          category: string
          condition: string
          created_at: string
          delivery_location_id: string
          id: string
          make: string
          model: string
          pickup_location_id: string
          position: number
          removed_at: string | null
          request_id: string
          rolling_ability: string | null
          updated_at: string
          uses_default_route: boolean
          year: number | null
        }
        Insert: {
          category: string
          condition: string
          created_at?: string
          delivery_location_id: string
          id?: string
          make: string
          model: string
          pickup_location_id: string
          position: number
          removed_at?: string | null
          request_id: string
          rolling_ability?: string | null
          updated_at?: string
          uses_default_route?: boolean
          year?: number | null
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          delivery_location_id?: string
          id?: string
          make?: string
          model?: string
          pickup_location_id?: string
          position?: number
          removed_at?: string | null
          request_id?: string
          rolling_ability?: string | null
          updated_at?: string
          uses_default_route?: boolean
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_vehicles_delivery_location_id_fkey"
            columns: ["delivery_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_vehicles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_requests: {
        Row: {
          budget_amount: number | null
          budget_currency: string | null
          client_publish_key: string
          closed_at: string | null
          created_at: string
          customer_id: string
          default_delivery_location_id: string
          default_pickup_location_id: string
          id: string
          moderation_status: string
          notes: string
          pickup_anchor_date: string | null
          pickup_flexible_option: string | null
          pickup_from: string | null
          pickup_kind: string
          pickup_to: string | null
          published_at: string | null
          request_version: number
          status: string
          target_carrier_id: string | null
          target_route_id: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string | null
          client_publish_key: string
          closed_at?: string | null
          created_at?: string
          customer_id: string
          default_delivery_location_id: string
          default_pickup_location_id: string
          id?: string
          moderation_status?: string
          notes?: string
          pickup_anchor_date?: string | null
          pickup_flexible_option?: string | null
          pickup_from?: string | null
          pickup_kind: string
          pickup_to?: string | null
          published_at?: string | null
          request_version?: number
          status?: string
          target_carrier_id?: string | null
          target_route_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          visibility: string
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string | null
          client_publish_key?: string
          closed_at?: string | null
          created_at?: string
          customer_id?: string
          default_delivery_location_id?: string
          default_pickup_location_id?: string
          id?: string
          moderation_status?: string
          notes?: string
          pickup_anchor_date?: string | null
          pickup_flexible_option?: string | null
          pickup_from?: string | null
          pickup_kind?: string
          pickup_to?: string | null
          published_at?: string | null
          request_version?: number
          status?: string
          target_carrier_id?: string | null
          target_route_id?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_default_delivery_location_id_fkey"
            columns: ["default_delivery_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_default_pickup_location_id_fkey"
            columns: ["default_pickup_location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_target_carrier_id_fkey"
            columns: ["target_carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
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

