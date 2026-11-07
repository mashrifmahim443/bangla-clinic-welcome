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
      appointment_notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          read_at: string | null
          slot_start: string
          status: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          slot_start: string
          status: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          slot_start?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_reports: {
        Row: {
          appointment_id: string
          report_id: string
        }
        Insert: {
          appointment_id: string
          report_id: string
        }
        Update: {
          appointment_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "old_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          consultation_type: string
          created_at: string
          doctor_id: string
          duration_minutes: number
          id: string
          patient_id: string
          reason: string
          refund_decision: string | null
          refund_note: string | null
          slot_start: string
          status: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          consultation_type?: string
          created_at?: string
          doctor_id: string
          duration_minutes?: number
          id?: string
          patient_id?: string
          reason?: string
          refund_decision?: string | null
          refund_note?: string | null
          slot_start: string
          status?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          consultation_type?: string
          created_at?: string
          doctor_id?: string
          duration_minutes?: number
          id?: string
          patient_id?: string
          reason?: string
          refund_decision?: string | null
          refund_note?: string | null
          slot_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_links: {
        Row: {
          ate: boolean | null
          created_at: string
          expires_at: string
          food: string | null
          slot: Database["public"]["Enums"]["checkin_slot"]
          token: string
          took_medicine: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          ate?: boolean | null
          created_at?: string
          expires_at?: string
          food?: string | null
          slot: Database["public"]["Enums"]["checkin_slot"]
          token?: string
          took_medicine?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Update: {
          ate?: boolean | null
          created_at?: string
          expires_at?: string
          food?: string | null
          slot?: Database["public"]["Enums"]["checkin_slot"]
          token?: string
          took_medicine?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consult_messages: {
        Row: {
          appointment_id: string
          body: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          appointment_id: string
          body: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Update: {
          appointment_id?: string
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consult_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          appointment_id: string | null
          calories: number | null
          cells: Json
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          calories?: number | null
          cells?: Json
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          calories?: number | null
          cells?: Json
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_templates: {
        Row: {
          calories: number | null
          cells: Json
          created_at: string
          doctor_id: string
          id: string
          is_public: boolean
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          calories?: number | null
          cells?: Json
          created_at?: string
          doctor_id: string
          id?: string
          is_public?: boolean
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          calories?: number | null
          cells?: Json
          created_at?: string
          doctor_id?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_templates_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_applications: {
        Row: {
          address: string | null
          admin_note: string | null
          bmdc_no: string
          created_at: string
          degrees: string
          designation: string | null
          email: string | null
          experience_years: number | null
          fee_bdt: number
          gender: string | null
          id: string
          name_bn: string
          name_en: string
          phone: string | null
          specialty: string
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
          whatsapp: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          bmdc_no: string
          created_at?: string
          degrees: string
          designation?: string | null
          email?: string | null
          experience_years?: number | null
          fee_bdt: number
          gender?: string | null
          id?: string
          name_bn: string
          name_en: string
          phone?: string | null
          specialty: string
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
          whatsapp?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          bmdc_no?: string
          created_at?: string
          degrees?: string
          designation?: string | null
          email?: string | null
          experience_years?: number | null
          fee_bdt?: number
          gender?: string | null
          id?: string
          name_bn?: string
          name_en?: string
          phone?: string | null
          specialty?: string
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
          whatsapp?: string | null
          workplace?: string | null
        }
        Relationships: []
      }
      doctor_contacts: {
        Row: {
          address: string
          email: string
          phone: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          address: string
          email: string
          phone: string
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          address?: string
          email?: string
          phone?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      doctor_leave: {
        Row: {
          doctor_id: string
          id: string
          leave_date: string
        }
        Insert: {
          doctor_id: string
          id?: string
          leave_date: string
        }
        Update: {
          doctor_id?: string
          id?: string
          leave_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_leave_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          appointment_id: string
          body: string
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          rating: number
        }
        Insert: {
          appointment_id: string
          body?: string
          created_at?: string
          doctor_id: string
          id?: string
          patient_id?: string
          rating: number
        }
        Update: {
          appointment_id?: string
          body?: string
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedule: {
        Row: {
          doctor_id: string
          end_time: string
          id: string
          slot_minutes: number
          start_time: string
          weekday: number
        }
        Insert: {
          doctor_id: string
          end_time: string
          id?: string
          slot_minutes?: number
          start_time: string
          weekday: number
        }
        Update: {
          doctor_id?: string
          end_time?: string
          id?: string
          slot_minutes?: number
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedule_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean
          bio_bn: string | null
          bio_en: string | null
          bmdc_no: string
          created_at: string
          degrees: string
          designation: string | null
          experience_years: number | null
          fee_bdt: number
          gender: string
          id: string
          is_special: boolean
          is_verified: boolean
          languages: string[]
          name_bn: string
          name_en: string
          photo_url: string | null
          slug: string
          specialty: string
          status: Database["public"]["Enums"]["doctor_status"]
          user_id: string | null
          workplace: string | null
        }
        Insert: {
          active?: boolean
          bio_bn?: string | null
          bio_en?: string | null
          bmdc_no: string
          created_at?: string
          degrees: string
          designation?: string | null
          experience_years?: number | null
          fee_bdt: number
          gender?: string
          id?: string
          is_special?: boolean
          is_verified?: boolean
          languages?: string[]
          name_bn: string
          name_en: string
          photo_url?: string | null
          slug: string
          specialty: string
          status?: Database["public"]["Enums"]["doctor_status"]
          user_id?: string | null
          workplace?: string | null
        }
        Update: {
          active?: boolean
          bio_bn?: string | null
          bio_en?: string | null
          bmdc_no?: string
          created_at?: string
          degrees?: string
          designation?: string | null
          experience_years?: number | null
          fee_bdt?: number
          gender?: string
          id?: string
          is_special?: boolean
          is_verified?: boolean
          languages?: string[]
          name_bn?: string
          name_en?: string
          photo_url?: string | null
          slug?: string
          specialty?: string
          status?: Database["public"]["Enums"]["doctor_status"]
          user_id?: string | null
          workplace?: string | null
        }
        Relationships: []
      }
      glucose_readings: {
        Row: {
          created_at: string
          id: string
          meal_slot: string | null
          note: string | null
          reading_type: Database["public"]["Enums"]["reading_type"]
          taken_at: string
          user_id: string
          value_mgdl: number | null
          value_mmol: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          meal_slot?: string | null
          note?: string | null
          reading_type?: Database["public"]["Enums"]["reading_type"]
          taken_at?: string
          user_id?: string
          value_mgdl?: number | null
          value_mmol?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          meal_slot?: string | null
          note?: string | null
          reading_type?: Database["public"]["Enums"]["reading_type"]
          taken_at?: string
          user_id?: string
          value_mgdl?: number | null
          value_mmol?: number | null
        }
        Relationships: []
      }
      old_prescriptions: {
        Row: {
          created_at: string
          doctor_name: string | null
          file_name: string
          file_path: string
          id: string
          kind: string
          note: string | null
          rx_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_name?: string | null
          file_name: string
          file_path: string
          id?: string
          kind?: string
          note?: string | null
          rx_date?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          doctor_name?: string | null
          file_name?: string
          file_path?: string
          id?: string
          kind?: string
          note?: string | null
          rx_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          advice: string | null
          appointment_id: string
          chief_complaints: string | null
          created_at: string
          doctor_id: string
          follow_up_date: string | null
          id: string
          items: Json
          patient_id: string
          updated_at: string
        }
        Insert: {
          advice?: string | null
          appointment_id: string
          chief_complaints?: string | null
          created_at?: string
          doctor_id: string
          follow_up_date?: string | null
          id?: string
          items?: Json
          patient_id: string
          updated_at?: string
        }
        Update: {
          advice?: string | null
          appointment_id?: string
          chief_complaints?: string | null
          created_at?: string
          doctor_id?: string
          follow_up_date?: string | null
          id?: string
          items?: Json
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          address: string | null
          birth_year: number | null
          created_at: string
          diabetes_type: Database["public"]["Enums"]["diabetes_type"] | null
          diagnosed_year: number | null
          emergency_contact: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          medicines: string | null
          other_conditions: string | null
          phone: string | null
          weight_kg: number | null
        }
        Insert: {
          account_status?: string
          address?: string | null
          birth_year?: number | null
          created_at?: string
          diabetes_type?: Database["public"]["Enums"]["diabetes_type"] | null
          diagnosed_year?: number | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          medicines?: string | null
          other_conditions?: string | null
          phone?: string | null
          weight_kg?: number | null
        }
        Update: {
          account_status?: string
          address?: string | null
          birth_year?: number | null
          created_at?: string
          diabetes_type?: Database["public"]["Enums"]["diabetes_type"] | null
          diagnosed_year?: number | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          medicines?: string | null
          other_conditions?: string | null
          phone?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_history: {
        Row: {
          delivery_source: string
          delivery_status: string
          delivery_updated_at: string | null
          http_status: number | null
          id: string
          message_text: string | null
          provider: string
          provider_status: number | null
          recipient: string
          recorded_at: string
          request_id: string | null
          sent_at: string | null
          sent_by: string | null
        }
        Insert: {
          delivery_source?: string
          delivery_status?: string
          delivery_updated_at?: string | null
          http_status?: number | null
          id?: string
          message_text?: string | null
          provider?: string
          provider_status?: number | null
          recipient: string
          recorded_at?: string
          request_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Update: {
          delivery_source?: string
          delivery_status?: string
          delivery_updated_at?: string | null
          http_status?: number | null
          id?: string
          message_text?: string | null
          provider?: string
          provider_status?: number | null
          recipient?: string
          recorded_at?: string
          request_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          id: string
          message_template: string
          sender_id: string
          test_number: string
          updated_at: string
        }
        Insert: {
          id?: string
          message_template?: string
          sender_id: string
          test_number?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message_template?: string
          sender_id?: string
          test_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      admin_set_account_status: {
        Args: { _status: string; _user: string }
        Returns: undefined
      }
      admin_users: {
        Args: never
        Returns: {
          account_status: string
          created_at: string
          deletion_requested: boolean
          email: string
          full_name: string
          id: string
          phone: string
          readings: number
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      available_doctor_slots: {
        Args: { _doctor: string; _from: string; _to: string }
        Returns: {
          duration_minutes: number
          slot_start: string
        }[]
      }
      book_appointment: {
        Args: {
          _doctor: string
          _reason: string
          _reports?: string[]
          _slot: string
          _type: string
        }
        Returns: string
      }
      booked_slots: {
        Args: { _doctor: string; _from: string; _to: string }
        Returns: string[]
      }
      change_appointment: {
        Args: { _id: string; _reason?: string; _slot?: string; _status: string }
        Returns: undefined
      }
      checkin_info: {
        Args: { _token: string }
        Returns: {
          first_name: string
          slot: Database["public"]["Enums"]["checkin_slot"]
          used: boolean
        }[]
      }
      create_my_doctor_profile: {
        Args: {
          _address: string
          _bmdc_no: string
          _degrees: string
          _designation: string
          _email: string
          _experience: number
          _fee_bdt: number
          _gender: string
          _name_bn: string
          _name_en: string
          _phone: string
          _specialty: string
          _whatsapp: string
          _workplace: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _user: string }; Returns: boolean }
      is_appointment_participant: { Args: { _appt: string }; Returns: boolean }
      is_doctor_of_patient: { Args: { _patient: string }; Returns: boolean }
      my_doctor_id: { Args: never; Returns: string }
      my_reviewed_appointments: { Args: never; Returns: string[] }
      profile_completion: { Args: { _user: string }; Returns: number }
      review_appointment_refund: {
        Args: { _approve: boolean; _id: string; _note: string }
        Returns: undefined
      }
      review_doctor_application: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      set_doctor_presence: {
        Args: {
          _bio_bn?: string
          _bio_en?: string
          _status: Database["public"]["Enums"]["doctor_status"]
        }
        Returns: undefined
      }
      submit_checkin: {
        Args: {
          _ate: boolean
          _food?: string
          _token: string
          _took_medicine: boolean
          _value: number
        }
        Returns: boolean
      }
      update_my_doctor_profile: {
        Args: {
          _degrees: string
          _designation: string
          _experience: number
          _workplace: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient"
      application_status: "pending" | "approved" | "rejected"
      checkin_slot: "morning" | "lunch" | "dinner"
      diabetes_type:
        | "type1"
        | "type2"
        | "gestational"
        | "prediabetes"
        | "unsure"
      doctor_status: "online" | "busy" | "offline"
      reading_type:
        | "fasting"
        | "before_meal"
        | "after_meal"
        | "bedtime"
        | "random"
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
      app_role: ["admin", "doctor", "patient"],
      application_status: ["pending", "approved", "rejected"],
      checkin_slot: ["morning", "lunch", "dinner"],
      diabetes_type: ["type1", "type2", "gestational", "prediabetes", "unsure"],
      doctor_status: ["online", "busy", "offline"],
      reading_type: [
        "fasting",
        "before_meal",
        "after_meal",
        "bedtime",
        "random",
      ],
    },
  },
} as const
