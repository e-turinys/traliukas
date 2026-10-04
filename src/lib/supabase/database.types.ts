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
      bookings: {
        Row: {
          accepted_offer_id: string | null
          accepted_offer_version: number | null
          agreed_total_price: number | null
          agreement_snapshot: Json | null
          carrier_id: string | null
          conversation_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          payment_terms: string | null
          planned_delivery_date: string | null
          planned_pickup_date: string | null
          request_id: string | null
          route_id: string | null
          snapshot_schema_version: number | null
          status: string | null
          vehicle_count: number | null
        }
        Insert: {
          accepted_offer_id?: string | null
          accepted_offer_version?: number | null
          agreed_total_price?: number | null
          agreement_snapshot?: Json | null
          carrier_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          payment_terms?: string | null
          planned_delivery_date?: string | null
          planned_pickup_date?: string | null
          request_id?: string | null
          route_id?: string | null
          snapshot_schema_version?: number | null
          status?: string | null
          vehicle_count?: number | null
        }
        Update: {
          accepted_offer_id?: string | null
          accepted_offer_version?: number | null
          agreed_total_price?: number | null
          agreement_snapshot?: Json | null
          carrier_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          payment_terms?: string | null
          planned_delivery_date?: string | null
          planned_pickup_date?: string | null
          request_id?: string | null
          route_id?: string | null
          snapshot_schema_version?: number | null
          status?: string | null
          vehicle_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_accepted_offer_id_accepted_offer_version_fkey"
            columns: ["accepted_offer_id", "accepted_offer_version"]
            isOneToOne: false
            referencedRelation: "offer_revisions"
            referencedColumns: ["offer_id", "version"]
          },
          {
            foreignKeyName: "bookings_accepted_offer_id_request_id_carrier_id_fkey"
            columns: ["accepted_offer_id", "request_id", "carrier_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id", "request_id", "carrier_id"]
          },
          {
            foreignKeyName: "bookings_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_conversation_id_request_id_carrier_id_fkey"
            columns: ["conversation_id", "request_id", "carrier_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id", "request_id", "carrier_id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "my_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "my_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "public_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_carriers: {
        Row: {
          display_name: string | null
          id: string | null
          registration_country: string | null
        }
        Insert: {
          display_name?: string | null
          id?: string | null
          registration_country?: string | null
        }
        Update: {
          display_name?: string | null
          id?: string | null
          registration_country?: string | null
        }
        Relationships: []
      }
      commercial_request_terms: {
        Row: {
          public_terms_snapshot: Json | null
          request_id: string | null
          version: number | null
        }
        Insert: {
          public_terms_snapshot?: Json | null
          request_id?: string | null
          version?: number | null
        }
        Update: {
          public_terms_snapshot?: Json | null
          request_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "request_revisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_revisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "my_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string | null
          carrier_id: string | null
          created_at: string | null
          current_offer_id: string | null
          id: string | null
          last_message_at: string | null
          request_id: string | null
          status: string | null
          viewer_side: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_current_offer_id_request_id_carrier_id_fkey"
            columns: ["current_offer_id", "request_id", "carrier_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id", "request_id", "carrier_id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "my_requests"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "commercial_carriers"
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
      messages: {
        Row: {
          body: string | null
          conversation_id: string | null
          created_at: string | null
          id: string | null
          kind: string | null
          sender_side: string | null
          sequence: number | null
        }
        Insert: {
          body?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string | null
          kind?: string | null
          sender_side?: string | null
          sequence?: number | null
        }
        Update: {
          body?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string | null
          kind?: string | null
          sender_side?: string | null
          sequence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["conversation_id"]
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
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
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
      my_read_cursors: {
        Row: {
          conversation_id: string | null
          last_read_sequence: number | null
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          last_read_sequence?: number | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          last_read_sequence?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["conversation_id"]
          },
        ]
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
      my_route_stops: {
        Row: {
          location_id: string | null
          position: number | null
          route_id: string | null
        }
        Insert: {
          location_id?: string | null
          position?: number | null
          route_id?: string | null
        }
        Update: {
          location_id?: string | null
          position?: number | null
          route_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "my_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "public_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      my_routes: {
        Row: {
          accepting_new_requests: boolean | null
          capacity_reserved: number | null
          capacity_total: number | null
          carrier_id: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          id: string | null
          moderation_status: string | null
          published_at: string | null
          route_flexible: boolean | null
          route_version: number | null
          status: string | null
          supported_categories: string[] | null
          supports_non_running: boolean | null
          updated_at: string | null
        }
        Insert: {
          accepting_new_requests?: boolean | null
          capacity_reserved?: number | null
          capacity_total?: number | null
          carrier_id?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string | null
          moderation_status?: string | null
          published_at?: string | null
          route_flexible?: boolean | null
          route_version?: number | null
          status?: string | null
          supported_categories?: string[] | null
          supports_non_running?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accepting_new_requests?: boolean | null
          capacity_reserved?: number | null
          capacity_total?: number | null
          carrier_id?: string | null
          created_at?: string | null
          date_from?: string | null
          date_to?: string | null
          id?: string | null
          moderation_status?: string | null
          published_at?: string | null
          route_flexible?: boolean | null
          route_version?: number | null
          status?: string | null
          supported_categories?: string[] | null
          supports_non_running?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_revisions: {
        Row: {
          carrier_comment: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          offer_id: string | null
          payment_terms: string | null
          pickup_time_from: string | null
          pickup_time_to: string | null
          pickup_time_zone: string | null
          planned_delivery_date: string | null
          planned_pickup_date: string | null
          request_id: string | null
          request_version: number | null
          route_id: string | null
          route_version: number | null
          total_price: number | null
          version: number | null
        }
        Insert: {
          carrier_comment?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          offer_id?: string | null
          payment_terms?: string | null
          pickup_time_from?: string | null
          pickup_time_to?: string | null
          pickup_time_zone?: string | null
          planned_delivery_date?: string | null
          planned_pickup_date?: string | null
          request_id?: string | null
          request_version?: number | null
          route_id?: string | null
          route_version?: number | null
          total_price?: number | null
          version?: number | null
        }
        Update: {
          carrier_comment?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          offer_id?: string | null
          payment_terms?: string | null
          pickup_time_from?: string | null
          pickup_time_to?: string | null
          pickup_time_zone?: string | null
          planned_delivery_date?: string | null
          planned_pickup_date?: string | null
          request_id?: string | null
          request_version?: number | null
          route_id?: string | null
          route_version?: number | null
          total_price?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_revisions_offer_id_request_id_route_id_fkey"
            columns: ["offer_id", "request_id", "route_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id", "request_id", "route_id"]
          },
          {
            foreignKeyName: "offer_revisions_request_id_request_version_fkey"
            columns: ["request_id", "request_version"]
            isOneToOne: false
            referencedRelation: "commercial_request_terms"
            referencedColumns: ["request_id", "version"]
          },
        ]
      }
      offers: {
        Row: {
          carrier_id: string | null
          conversation_id: string | null
          created_at: string | null
          current_version: number | null
          id: string | null
          request_id: string | null
          route_id: string | null
          status: string | null
          updated_at: string | null
          viewer_side: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_current_revision"
            columns: ["id", "current_version"]
            isOneToOne: false
            referencedRelation: "offer_revisions"
            referencedColumns: ["offer_id", "version"]
          },
          {
            foreignKeyName: "offers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "my_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "my_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "public_routes"
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
      public_route_stops: {
        Row: {
          location_id: string | null
          position: number | null
          route_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "my_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "public_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      public_routes: {
        Row: {
          accepting_new_requests: boolean | null
          capacity_available: number | null
          capacity_reserved: number | null
          capacity_total: number | null
          carrier_id: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          id: string | null
          published_at: string | null
          route_flexible: boolean | null
          route_version: number | null
          status: string | null
          supported_categories: string[] | null
          supports_non_running: boolean | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "commercial_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "my_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "public_carriers"
            referencedColumns: ["id"]
          },
        ]
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
      accept_offer: {
        Args: {
          p_expected_offer_version: number
          p_expected_request_version: number
          p_expected_route_version: number
          p_offer_id: string
        }
        Returns: Json
      }
      close_route: {
        Args: { p_expected_version: number; p_route_id: string }
        Returns: string
      }
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
      decline_offer: {
        Args: { p_expected_version: number; p_offer_id: string }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_sequence: number }
        Returns: undefined
      }
      publish_request: {
        Args: { p_client_publish_key: string; p_payload: Json }
        Returns: string
      }
      save_route: {
        Args: {
          p_carrier_slug?: string
          p_create_key?: string
          p_expected_version?: number
          p_payload: Json
          p_publish: boolean
          p_route_id?: string
        }
        Returns: string
      }
      send_message: {
        Args: {
          p_body: string
          p_client_key: string
          p_conversation_id: string
        }
        Returns: string
      }
      submit_offer: {
        Args: {
          p_expected_offer_version?: number
          p_expected_request_version: number
          p_expected_route_version: number
          p_request_id: string
          p_route_id: string
          p_terms: Json
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
      booking_vehicle_operations: {
        Row: {
          booking_id: string
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country_code: string | null
          created_at: string
          eta: string | null
          instructions: string | null
          operation_version: number
          postcode: string | null
          scheduled_from: string | null
          scheduled_to: string | null
          side: string
          street: string | null
          updated_at: string
          updated_by: string
          vehicle_id: string
        }
        Insert: {
          booking_id: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country_code?: string | null
          created_at?: string
          eta?: string | null
          instructions?: string | null
          operation_version?: number
          postcode?: string | null
          scheduled_from?: string | null
          scheduled_to?: string | null
          side: string
          street?: string | null
          updated_at?: string
          updated_by: string
          vehicle_id: string
        }
        Update: {
          booking_id?: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country_code?: string | null
          created_at?: string
          eta?: string | null
          instructions?: string | null
          operation_version?: number
          postcode?: string | null
          scheduled_from?: string | null
          scheduled_to?: string | null
          side?: string
          street?: string | null
          updated_at?: string
          updated_by?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_vehicle_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_vehicle_operations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_vehicle_operations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "request_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_offer_id: string
          accepted_offer_version: number
          agreed_total_price: number
          agreement_snapshot: Json
          cancelled_at: string | null
          capacity_released_at: string | null
          carrier_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          currency: string
          customer_id: string
          id: string
          payment_terms: string
          planned_delivery_date: string
          planned_pickup_date: string
          request_id: string
          route_id: string
          snapshot_schema_version: number
          status: string
          status_changed_at: string
          status_version: number
          updated_at: string
          vehicle_count: number
        }
        Insert: {
          accepted_offer_id: string
          accepted_offer_version: number
          agreed_total_price: number
          agreement_snapshot: Json
          cancelled_at?: string | null
          capacity_released_at?: string | null
          carrier_id: string
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          currency: string
          customer_id: string
          id?: string
          payment_terms: string
          planned_delivery_date: string
          planned_pickup_date: string
          request_id: string
          route_id: string
          snapshot_schema_version?: number
          status?: string
          status_changed_at?: string
          status_version?: number
          updated_at?: string
          vehicle_count: number
        }
        Update: {
          accepted_offer_id?: string
          accepted_offer_version?: number
          agreed_total_price?: number
          agreement_snapshot?: Json
          cancelled_at?: string | null
          capacity_released_at?: string | null
          carrier_id?: string
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          payment_terms?: string
          planned_delivery_date?: string
          planned_pickup_date?: string
          request_id?: string
          route_id?: string
          snapshot_schema_version?: number
          status?: string
          status_changed_at?: string
          status_version?: number
          updated_at?: string
          vehicle_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_accepted_offer_id_accepted_offer_version_fkey"
            columns: ["accepted_offer_id", "accepted_offer_version"]
            isOneToOne: false
            referencedRelation: "offer_revisions"
            referencedColumns: ["offer_id", "version"]
          },
          {
            foreignKeyName: "bookings_accepted_offer_id_request_id_carrier_id_fkey"
            columns: ["accepted_offer_id", "request_id", "carrier_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id", "request_id", "carrier_id"]
          },
          {
            foreignKeyName: "bookings_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_conversation_id_request_id_carrier_id_fkey"
            columns: ["conversation_id", "request_id", "carrier_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id", "request_id", "carrier_id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "carrier_routes"
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
      carrier_routes: {
        Row: {
          accepting_new_requests: boolean
          capacity_reserved: number
          capacity_total: number
          carrier_id: string
          created_at: string
          date_from: string
          date_to: string
          id: string
          moderation_status: string
          published_at: string | null
          route_flexible: boolean
          route_version: number
          status: string
          supported_categories: string[]
          supports_non_running: boolean
          updated_at: string
        }
        Insert: {
          accepting_new_requests?: boolean
          capacity_reserved?: number
          capacity_total: number
          carrier_id: string
          created_at?: string
          date_from: string
          date_to: string
          id?: string
          moderation_status?: string
          published_at?: string | null
          route_flexible?: boolean
          route_version?: number
          status?: string
          supported_categories: string[]
          supports_non_running?: boolean
          updated_at?: string
        }
        Update: {
          accepting_new_requests?: boolean
          capacity_reserved?: number
          capacity_total?: number
          carrier_id?: string
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          moderation_status?: string
          published_at?: string | null
          route_flexible?: boolean
          route_version?: number
          status?: string
          supported_categories?: string[]
          supports_non_running?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_routes_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
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
      conversation_reads: {
        Row: {
          conversation_id: string
          created_at: string
          last_read_sequence: number
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          last_read_sequence?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          last_read_sequence?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          carrier_id: string
          created_at: string
          current_offer_id: string
          id: string
          last_message_at: string
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          current_offer_id: string
          id?: string
          last_message_at?: string
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          current_offer_id?: string
          id?: string
          last_message_at?: string
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_current_offer_id_request_id_carrier_id_fkey"
            columns: ["current_offer_id", "request_id", "carrier_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id", "request_id", "carrier_id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          actor_id: string | null
          booking_id: string | null
          conversation_id: string | null
          created_at: string
          dedupe_key: string
          event_type: string
          id: string
          offer_id: string | null
          payload: Json
          payload_schema_version: number
          request_id: string
          route_id: string | null
        }
        Insert: {
          actor_id?: string | null
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          dedupe_key: string
          event_type: string
          id?: string
          offer_id?: string | null
          payload?: Json
          payload_schema_version?: number
          request_id: string
          route_id?: string | null
        }
        Update: {
          actor_id?: string | null
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string
          event_type?: string
          id?: string
          offer_id?: string | null
          payload?: Json
          payload_schema_version?: number
          request_id?: string
          route_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_events_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "carrier_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          client_message_key: string | null
          conversation_id: string
          created_at: string
          event_id: string | null
          id: string
          kind: string
          sender_side: string
          sender_user_id: string | null
          sequence: number
        }
        Insert: {
          body: string
          client_message_key?: string | null
          conversation_id: string
          created_at?: string
          event_id?: string | null
          id?: string
          kind: string
          sender_side: string
          sender_user_id?: string | null
          sequence: number
        }
        Update: {
          body?: string
          client_message_key?: string | null
          conversation_id?: string
          created_at?: string
          event_id?: string | null
          id?: string
          kind?: string
          sender_side?: string
          sender_user_id?: string | null
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_revisions: {
        Row: {
          carrier_comment: string | null
          created_at: string
          currency: string
          expires_at: string
          offer_id: string
          payment_terms: string
          pickup_time_from: string | null
          pickup_time_to: string | null
          pickup_time_zone: string
          planned_delivery_date: string
          planned_pickup_date: string
          request_id: string
          request_version: number
          revised_by: string
          route_id: string
          route_version: number
          total_price: number
          version: number
        }
        Insert: {
          carrier_comment?: string | null
          created_at?: string
          currency?: string
          expires_at: string
          offer_id: string
          payment_terms: string
          pickup_time_from?: string | null
          pickup_time_to?: string | null
          pickup_time_zone: string
          planned_delivery_date: string
          planned_pickup_date: string
          request_id: string
          request_version: number
          revised_by: string
          route_id: string
          route_version: number
          total_price: number
          version: number
        }
        Update: {
          carrier_comment?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          offer_id?: string
          payment_terms?: string
          pickup_time_from?: string | null
          pickup_time_to?: string | null
          pickup_time_zone?: string
          planned_delivery_date?: string
          planned_pickup_date?: string
          request_id?: string
          request_version?: number
          revised_by?: string
          route_id?: string
          route_version?: number
          total_price?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_revisions_offer_id_request_id_route_id_fkey"
            columns: ["offer_id", "request_id", "route_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id", "request_id", "route_id"]
          },
          {
            foreignKeyName: "offer_revisions_request_id_request_version_fkey"
            columns: ["request_id", "request_version"]
            isOneToOne: false
            referencedRelation: "request_revisions"
            referencedColumns: ["request_id", "version"]
          },
          {
            foreignKeyName: "offer_revisions_revised_by_fkey"
            columns: ["revised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_revisions_route_id_route_version_fkey"
            columns: ["route_id", "route_version"]
            isOneToOne: false
            referencedRelation: "route_revisions"
            referencedColumns: ["route_id", "version"]
          },
        ]
      }
      offers: {
        Row: {
          carrier_id: string
          created_at: string
          created_by: string
          current_version: number
          id: string
          request_id: string
          route_id: string
          status: string
          updated_at: string
        }
        Insert: {
          carrier_id: string
          created_at?: string
          created_by: string
          current_version?: number
          id?: string
          request_id: string
          route_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          carrier_id?: string
          created_at?: string
          created_by?: string
          current_version?: number
          id?: string
          request_id?: string
          route_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_current_revision"
            columns: ["id", "current_version"]
            isOneToOne: false
            referencedRelation: "offer_revisions"
            referencedColumns: ["offer_id", "version"]
          },
          {
            foreignKeyName: "offers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transport_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "carrier_routes"
            referencedColumns: ["id"]
          },
        ]
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
      route_revisions: {
        Row: {
          changed_by: string
          created_at: string
          public_terms_snapshot: Json
          route_id: string
          snapshot_schema_version: number
          version: number
        }
        Insert: {
          changed_by: string
          created_at?: string
          public_terms_snapshot: Json
          route_id: string
          snapshot_schema_version?: number
          version: number
        }
        Update: {
          changed_by?: string
          created_at?: string
          public_terms_snapshot?: Json
          route_id?: string
          snapshot_schema_version?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_revisions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "carrier_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string
          id: string
          location_id: string
          position: number
          route_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          position: number
          route_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          position?: number
          route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "public_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "carrier_routes"
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
            foreignKeyName: "request_target_route_fk"
            columns: ["target_route_id"]
            isOneToOne: false
            referencedRelation: "carrier_routes"
            referencedColumns: ["id"]
          },
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

