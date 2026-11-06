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
      appointments: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          slot_start: string
          status: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id?: string
          slot_start: string
          status?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
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
      doctor_applications: {
        Row: {
          admin_note: string | null
          bmdc_no: string
          created_at: string
          degrees: string
          fee_bdt: number
          gender: string | null
          id: string
          name_bn: string
          name_en: string
          phone: string | null
          specialty: string
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          bmdc_no: string
          created_at?: string
          degrees: string
          fee_bdt: number
          gender?: string | null
          id?: string
          name_bn: string
          name_en: string
          phone?: string | null
          specialty: string
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
        }
        Update: {
          admin_note?: string | null
          bmdc_no?: string
          created_at?: string
          degrees?: string
          fee_bdt?: number
          gender?: string | null
          id?: string
          name_bn?: string
          name_en?: string
          phone?: string | null
          specialty?: string
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          bmdc_no: string
          created_at: string
          degrees: string
          fee_bdt: number
          gender: string
          id: string
          languages: string[]
          name_bn: string
          name_en: string
          slug: string
          specialty: string
          status: Database["public"]["Enums"]["doctor_status"]
          user_id: string | null
        }
        Insert: {
          bmdc_no: string
          created_at?: string
          degrees: string
          fee_bdt: number
          gender?: string
          id?: string
          languages?: string[]
          name_bn: string
          name_en: string
          slug: string
          specialty: string
          status?: Database["public"]["Enums"]["doctor_status"]
          user_id?: string | null
        }
        Update: {
          bmdc_no?: string
          created_at?: string
          degrees?: string
          fee_bdt?: number
          gender?: string
          id?: string
          languages?: string[]
          name_bn?: string
          name_en?: string
          slug?: string
          specialty?: string
          status?: Database["public"]["Enums"]["doctor_status"]
          user_id?: string | null
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
          birth_year: number | null
          created_at: string
          diabetes_type: Database["public"]["Enums"]["diabetes_type"] | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          diabetes_type?: Database["public"]["Enums"]["diabetes_type"] | null
          full_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          diabetes_type?: Database["public"]["Enums"]["diabetes_type"] | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
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
      admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          readings: number
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      booked_slots: {
        Args: { _doctor: string; _from: string; _to: string }
        Returns: string[]
      }
      checkin_info: {
        Args: { _token: string }
        Returns: {
          first_name: string
          slot: Database["public"]["Enums"]["checkin_slot"]
          used: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_appointment_participant: { Args: { _appt: string }; Returns: boolean }
      is_doctor_of_patient: { Args: { _patient: string }; Returns: boolean }
      my_doctor_id: { Args: never; Returns: string }
      review_doctor_application: {
        Args: { _approve: boolean; _id: string; _note?: string }
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
