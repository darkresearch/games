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
      spaceship_state: {
        Row: {
          id: string
          position: [number, number, number]
          velocity: [number, number, number]
          rotation: [number, number, number, number]
          fuel: number
          target_planet_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          position: [number, number, number]
          velocity: [number, number, number]
          rotation: [number, number, number, number]
          fuel: number
          target_planet_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          position?: [number, number, number]
          velocity?: [number, number, number]
          rotation?: [number, number, number, number]
          fuel?: number
          target_planet_id?: string | null
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
      [_ in never]: never
    }
  }
} 