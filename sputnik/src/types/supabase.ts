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
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          twitter_username: string | null;
          twitter_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          twitter_username?: string | null;
          twitter_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          twitter_username?: string | null;
          twitter_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sputniks: {
        Row: {
          id: string;
          user_id: string;
          sputnik_uuid: string;
          created_at: string;
          display_name: string | null;
          sputnik_creation_number: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          sputnik_uuid: string;
          created_at?: string;
          display_name?: string | null;
          sputnik_creation_number?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          sputnik_uuid?: string;
          created_at?: string;
          display_name?: string | null;
          sputnik_creation_number?: number | null;
        };
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
        };
      };
      public_sputnik_profiles: {
        Row: {
          sputnik_uuid: string;
          sputnik_name: string | null;
          username: string | null;
          user_display_name: string | null;
          avatar_url: string | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  }
} 