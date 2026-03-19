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
      availability_requests: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string
          effective_until: string | null
          id: string
          inbound_time: string | null
          notes: string | null
          outbound_time: string | null
          passenger_id: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          week_start: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from?: string
          effective_until?: string | null
          id?: string
          inbound_time?: string | null
          notes?: string | null
          outbound_time?: string | null
          passenger_id: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          week_start?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string
          effective_until?: string | null
          id?: string
          inbound_time?: string | null
          notes?: string | null
          outbound_time?: string | null
          passenger_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers_with_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          branch_name: string
          building_note: string | null
          city: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          province: string | null
          street: string
          suburb: string | null
          updated_at: string
        }
        Insert: {
          branch_name: string
          building_note?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          province?: string | null
          street: string
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          branch_name?: string
          building_note?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          province?: string | null
          street?: string
          suburb?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          building_note: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          is_school: boolean
          latitude: number
          longitude: number
          province: string | null
          site_name: string | null
          street: string
          suburb: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          building_note?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_school?: boolean
          latitude: number
          longitude: number
          province?: string | null
          site_name?: string | null
          street: string
          suburb?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          building_note?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_school?: boolean
          latitude?: number
          longitude?: number
          province?: string | null
          site_name?: string | null
          street?: string
          suburb?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      dispatch_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          performed_by: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      driver_location_history: {
        Row: {
          accuracy: number | null
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
          trip_id: string | null
        }
        Insert: {
          accuracy?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_location_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_location_history_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_location_history_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          trip_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          accuracy?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          afternoon_shift: boolean
          assigned_depot: string | null
          availability_days: Json
          consent_background_check: boolean
          consent_driving_record: boolean
          consent_info_accurate: boolean
          coverage_areas: Json
          created_at: string
          date_of_birth: string | null
          dispatcher_name: string | null
          dispatcher_phone: string | null
          driver_code: string | null
          gender: string | null
          home_suburb: string | null
          id: string
          id_number: string | null
          is_active: boolean
          is_online: boolean
          license_code: string | null
          license_expiry: string | null
          license_number: string | null
          license_plate: string | null
          morning_shift: boolean
          onboarding_completed: boolean
          pdp_expiry: string | null
          pdp_number: string | null
          updated_at: string
          user_id: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_photo_url: string | null
        }
        Insert: {
          afternoon_shift?: boolean
          assigned_depot?: string | null
          availability_days?: Json
          consent_background_check?: boolean
          consent_driving_record?: boolean
          consent_info_accurate?: boolean
          coverage_areas?: Json
          created_at?: string
          date_of_birth?: string | null
          dispatcher_name?: string | null
          dispatcher_phone?: string | null
          driver_code?: string | null
          gender?: string | null
          home_suburb?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean
          is_online?: boolean
          license_code?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string | null
          morning_shift?: boolean
          onboarding_completed?: boolean
          pdp_expiry?: string | null
          pdp_number?: string | null
          updated_at?: string
          user_id: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
        }
        Update: {
          afternoon_shift?: boolean
          assigned_depot?: string | null
          availability_days?: Json
          consent_background_check?: boolean
          consent_driving_record?: boolean
          consent_info_accurate?: boolean
          coverage_areas?: Json
          created_at?: string
          date_of_birth?: string | null
          dispatcher_name?: string | null
          dispatcher_phone?: string | null
          driver_code?: string | null
          gender?: string | null
          home_suburb?: string | null
          id?: string
          id_number?: string | null
          is_active?: boolean
          is_online?: boolean
          license_code?: string | null
          license_expiry?: string | null
          license_number?: string | null
          license_plate?: string | null
          morning_shift?: boolean
          onboarding_completed?: boolean
          pdp_expiry?: string | null
          pdp_number?: string | null
          updated_at?: string
          user_id?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
        }
        Relationships: []
      }
      guardians: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_emergency_contact: boolean
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_emergency_contact?: boolean
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_emergency_contact?: boolean
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          account_status: string
          address_confidence: string | null
          branch_id: string | null
          cancellation_count: number
          company: string | null
          company_id: string | null
          created_at: string
          department: string | null
          eligibility_override: boolean
          eligibility_override_at: string | null
          eligibility_override_by: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          guardian_id: string | null
          home_address: string | null
          home_city: string | null
          home_house_number: string | null
          home_lat: number | null
          home_lng: number | null
          home_province: string | null
          home_street: string | null
          home_suburb: string | null
          id: string
          is_active: boolean
          is_high_risk: boolean
          is_minor: boolean
          no_show_count: number
          onboarding_completed: boolean
          passenger_type: Database["public"]["Enums"]["passenger_type"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_notes: string | null
          ride_type: string
          route_group_id: string | null
          school_address: string | null
          school_city: string | null
          school_company_id: string | null
          school_lat: number | null
          school_lng: number | null
          school_province: string | null
          school_street: string | null
          school_suburb: string | null
          shift_type: string | null
          updated_at: string
          user_id: string
          work_address: string | null
          work_lat: number | null
          work_lng: number | null
        }
        Insert: {
          account_status?: string
          address_confidence?: string | null
          branch_id?: string | null
          cancellation_count?: number
          company?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          eligibility_override?: boolean
          eligibility_override_at?: string | null
          eligibility_override_by?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          guardian_id?: string | null
          home_address?: string | null
          home_city?: string | null
          home_house_number?: string | null
          home_lat?: number | null
          home_lng?: number | null
          home_province?: string | null
          home_street?: string | null
          home_suburb?: string | null
          id?: string
          is_active?: boolean
          is_high_risk?: boolean
          is_minor?: boolean
          no_show_count?: number
          onboarding_completed?: boolean
          passenger_type?: Database["public"]["Enums"]["passenger_type"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_notes?: string | null
          ride_type?: string
          route_group_id?: string | null
          school_address?: string | null
          school_city?: string | null
          school_company_id?: string | null
          school_lat?: number | null
          school_lng?: number | null
          school_province?: string | null
          school_street?: string | null
          school_suburb?: string | null
          shift_type?: string | null
          updated_at?: string
          user_id: string
          work_address?: string | null
          work_lat?: number | null
          work_lng?: number | null
        }
        Update: {
          account_status?: string
          address_confidence?: string | null
          branch_id?: string | null
          cancellation_count?: number
          company?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          eligibility_override?: boolean
          eligibility_override_at?: string | null
          eligibility_override_by?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          guardian_id?: string | null
          home_address?: string | null
          home_city?: string | null
          home_house_number?: string | null
          home_lat?: number | null
          home_lng?: number | null
          home_province?: string | null
          home_street?: string | null
          home_suburb?: string | null
          id?: string
          is_active?: boolean
          is_high_risk?: boolean
          is_minor?: boolean
          no_show_count?: number
          onboarding_completed?: boolean
          passenger_type?: Database["public"]["Enums"]["passenger_type"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_notes?: string | null
          ride_type?: string
          route_group_id?: string | null
          school_address?: string | null
          school_city?: string | null
          school_company_id?: string | null
          school_lat?: number | null
          school_lng?: number | null
          school_province?: string | null
          school_street?: string | null
          school_suburb?: string | null
          shift_type?: string | null
          updated_at?: string
          user_id?: string
          work_address?: string | null
          work_lat?: number | null
          work_lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_passengers_guardian"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_passengers_route_group"
            columns: ["route_group_id"]
            isOneToOne: false
            referencedRelation: "route_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_school_company_id_fkey"
            columns: ["school_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ride_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_trip_id: string | null
          company_id: string | null
          created_at: string
          destination_address: string
          destination_lat: number | null
          destination_lng: number | null
          guardian_id: string | null
          id: string
          modified_route_group: string | null
          modified_time: string | null
          notes: string | null
          passenger_id: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          rejected_reason: string | null
          requested_date: string
          requested_time: string
          status: Database["public"]["Enums"]["request_status"]
          submitted_by_guardian: boolean
          trip_type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_trip_id?: string | null
          company_id?: string | null
          created_at?: string
          destination_address: string
          destination_lat?: number | null
          destination_lng?: number | null
          guardian_id?: string | null
          id?: string
          modified_route_group?: string | null
          modified_time?: string | null
          notes?: string | null
          passenger_id?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rejected_reason?: string | null
          requested_date: string
          requested_time: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_by_guardian?: boolean
          trip_type: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_trip_id?: string | null
          company_id?: string | null
          created_at?: string
          destination_address?: string
          destination_lat?: number | null
          destination_lng?: number | null
          guardian_id?: string | null
          id?: string
          modified_route_group?: string | null
          modified_time?: string | null
          notes?: string | null
          passenger_id?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rejected_reason?: string | null
          requested_date?: string
          requested_time?: string
          status?: Database["public"]["Enums"]["request_status"]
          submitted_by_guardian?: boolean
          trip_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_assigned_trip_id_fkey"
            columns: ["assigned_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers_with_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      route_groups: {
        Row: {
          area: string | null
          created_at: string
          created_by: string | null
          description: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      safety_log: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          triggered_by: string
          trip_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          triggered_by?: string
          trip_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          triggered_by?: string
          trip_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_log_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_log_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_log_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      scholar_profiles: {
        Row: {
          created_at: string
          grade_year: string | null
          guardian_email: string | null
          guardian_full_name: string
          guardian_phone: string
          id: string
          passenger_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_year?: string | null
          guardian_email?: string | null
          guardian_full_name: string
          guardian_phone: string
          id?: string
          passenger_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_year?: string | null
          guardian_email?: string | null
          guardian_full_name?: string
          guardian_phone?: string
          id?: string
          passenger_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholar_profiles_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: true
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholar_profiles_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: true
            referencedRelation: "passengers_with_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      status_logs: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          latitude: number | null
          log_type: Database["public"]["Enums"]["status_log_type"]
          longitude: number | null
          message: string
          metadata: Json | null
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          latitude?: number | null
          log_type: Database["public"]["Enums"]["status_log_type"]
          longitude?: number | null
          message: string
          metadata?: Json | null
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          latitude?: number | null
          log_type?: Database["public"]["Enums"]["status_log_type"]
          longitude?: number | null
          message?: string
          metadata?: Json | null
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_events: {
        Row: {
          driver_id: string | null
          event_type: string
          id: string
          latitude: number | null
          longitude: number | null
          passenger_id: string | null
          payload: Json | null
          recorded_at: string
          trip_id: string
        }
        Insert: {
          driver_id?: string | null
          event_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          passenger_id?: string | null
          payload?: Json | null
          recorded_at?: string
          trip_id: string
        }
        Update: {
          driver_id?: string | null
          event_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          passenger_id?: string | null
          payload?: Json | null
          recorded_at?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_passengers: {
        Row: {
          boarded_at: string | null
          created_at: string
          dropoff_address: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_time: string | null
          eta_minutes: number | null
          id: string
          passenger_id: string
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_order: number
          pickup_time: string | null
          seat_number: number | null
          status: Database["public"]["Enums"]["passenger_trip_status"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          boarded_at?: string | null
          created_at?: string
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_time?: string | null
          eta_minutes?: number | null
          id?: string
          passenger_id: string
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_order?: number
          pickup_time?: string | null
          seat_number?: number | null
          status?: Database["public"]["Enums"]["passenger_trip_status"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          boarded_at?: string | null
          created_at?: string
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_time?: string | null
          eta_minutes?: number | null
          id?: string
          passenger_id?: string
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_order?: number
          pickup_time?: string | null
          seat_number?: number | null
          status?: Database["public"]["Enums"]["passenger_trip_status"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          created_at: string
          destination_address: string
          destination_lat: number | null
          destination_lng: number | null
          direction: string | null
          driver_id: string | null
          id: string
          notes: string | null
          origin_address: string
          origin_lat: number | null
          origin_lng: number | null
          pickup_time: string
          pickup_time_window_minutes: number | null
          route_group_id: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["trip_status"]
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string
          destination_address: string
          destination_lat?: number | null
          destination_lng?: number | null
          direction?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          origin_address: string
          origin_lat?: number | null
          origin_lng?: number | null
          pickup_time: string
          pickup_time_window_minutes?: number | null
          route_group_id?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string
          destination_address?: string
          destination_lat?: number | null
          destination_lng?: number | null
          direction?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          origin_address?: string
          origin_lat?: number | null
          origin_lng?: number | null
          pickup_time?: string
          pickup_time_window_minutes?: number | null
          route_group_id?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_with_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_group_id_fkey"
            columns: ["route_group_id"]
            isOneToOne: false
            referencedRelation: "route_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
      vehicles: {
        Row: {
          capacity: number
          color: string | null
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          license_plate: string
          make: string
          model: string
          notes: string | null
          photo_front_url: string | null
          photo_interior_driver_url: string | null
          photo_interior_passenger_url: string | null
          photo_rear_url: string | null
          registration_doc_url: string | null
          seats: number | null
          status: string | null
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verified_by_admin: boolean
          year: number | null
        }
        Insert: {
          capacity?: number
          color?: string | null
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          license_plate: string
          make: string
          model: string
          notes?: string | null
          photo_front_url?: string | null
          photo_interior_driver_url?: string | null
          photo_interior_passenger_url?: string | null
          photo_rear_url?: string | null
          registration_doc_url?: string | null
          seats?: number | null
          status?: string | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          verified_by_admin?: boolean
          year?: number | null
        }
        Update: {
          capacity?: number
          color?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          license_plate?: string
          make?: string
          model?: string
          notes?: string | null
          photo_front_url?: string | null
          photo_interior_driver_url?: string | null
          photo_interior_passenger_url?: string | null
          photo_rear_url?: string | null
          registration_doc_url?: string | null
          seats?: number | null
          status?: string | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          verified_by_admin?: boolean
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_with_profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      drivers_with_profile: {
        Row: {
          assigned_depot: string | null
          avatar_url: string | null
          created_at: string | null
          dispatcher_name: string | null
          dispatcher_phone: string | null
          driver_code: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          is_online: boolean | null
          license_number: string | null
          license_plate: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_photo_url: string | null
        }
        Relationships: []
      }
      passengers_with_profile: {
        Row: {
          account_status: string | null
          address_confidence: string | null
          avatar_url: string | null
          branch_id: string | null
          cancellation_count: number | null
          company: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          eligibility_override: boolean | null
          eligibility_override_at: string | null
          eligibility_override_by: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          full_name: string | null
          guardian_id: string | null
          home_address: string | null
          home_city: string | null
          home_house_number: string | null
          home_lat: number | null
          home_lng: number | null
          home_province: string | null
          home_street: string | null
          home_suburb: string | null
          id: string | null
          is_active: boolean | null
          is_high_risk: boolean | null
          is_minor: boolean | null
          no_show_count: number | null
          onboarding_completed: boolean | null
          passenger_type: Database["public"]["Enums"]["passenger_type"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          phone: string | null
          pickup_notes: string | null
          ride_type: string | null
          route_group_id: string | null
          school_address: string | null
          school_city: string | null
          school_company_id: string | null
          school_lat: number | null
          school_lng: number | null
          school_province: string | null
          school_street: string | null
          school_suburb: string | null
          shift_type: string | null
          updated_at: string | null
          user_id: string | null
          work_address: string | null
          work_lat: number | null
          work_lng: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_passengers_guardian"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_passengers_route_group"
            columns: ["route_group_id"]
            isOneToOne: false
            referencedRelation: "route_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_school_company_id_fkey"
            columns: ["school_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_driver_id: { Args: { _user_id: string }; Returns: string }
      get_passenger_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      passenger_has_active_trip_with_driver: {
        Args: { _driver_id: string; _user_id: string }
        Returns: boolean
      }
      passenger_has_trip_with_driver: {
        Args: { _driver_id: string; _user_id: string }
        Returns: boolean
      }
      user_drives_active_trip_with_passenger: {
        Args: { _passenger_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_driver_on_trip: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_passenger_on_trip: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "driver" | "passenger"
      group_type: "staff" | "scholar"
      passenger_trip_status:
        | "confirmed"
        | "picked_up"
        | "dropped_off"
        | "no_show"
        | "cancelled"
      passenger_type: "staff" | "scholar"
      payment_status:
        | "paid"
        | "unpaid"
        | "partial"
        | "monthly_active"
        | "weekly_active"
        | "pay_per_trip"
        | "overdue"
      request_status: "pending" | "approved" | "rejected" | "modified"
      status_log_type:
        | "trip_status"
        | "passenger_status"
        | "driver_location"
        | "sos_alert"
        | "notification"
      trip_status:
        | "scheduled"
        | "driver_assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      trip_type: "inbound" | "outbound"
      vehicle_type:
        | "car"
        | "kombi"
        | "bus"
        | "sedan"
        | "suv"
        | "van"
        | "minibus"
        | "bakkie"
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
      app_role: ["admin", "driver", "passenger"],
      group_type: ["staff", "scholar"],
      passenger_trip_status: [
        "confirmed",
        "picked_up",
        "dropped_off",
        "no_show",
        "cancelled",
      ],
      passenger_type: ["staff", "scholar"],
      payment_status: [
        "paid",
        "unpaid",
        "partial",
        "monthly_active",
        "weekly_active",
        "pay_per_trip",
        "overdue",
      ],
      request_status: ["pending", "approved", "rejected", "modified"],
      status_log_type: [
        "trip_status",
        "passenger_status",
        "driver_location",
        "sos_alert",
        "notification",
      ],
      trip_status: [
        "scheduled",
        "driver_assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      trip_type: ["inbound", "outbound"],
      vehicle_type: [
        "car",
        "kombi",
        "bus",
        "sedan",
        "suv",
        "van",
        "minibus",
        "bakkie",
      ],
    },
  },
} as const
