export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_surveys: {
        Row: {
          id: string
          user_id: string
          age_category: '18-25' | '26-35' | '36-45' | '46+'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          age_category: '18-25' | '26-35' | '36-45' | '46+'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          age_category?: '18-25' | '26-35' | '36-45' | '46+'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      age_category: '18-25' | '26-35' | '36-45' | '46+'
      habit_category: 'Health' | 'Productivity' | 'Finance' | 'Relationships' | 'Learning' | 'Spiritual/Mental'
    }
  }
}
