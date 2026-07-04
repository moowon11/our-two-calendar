// schema.sql 과 1:1로 손으로 맞춘 타입(Supabase CLI 없이 작성).
// 테이블 컬럼을 바꾸면 이 파일도 함께 갱신한다.

type OwnerKind = "individual" | "shared";
type RepeatRule = "none" | "weekly" | "monthly" | "yearly";
type MemberRole = "a" | "b";
type AttachedToType = "event" | "note" | "date";

export interface Database {
  public: {
    Tables: {
      couples: {
        Row: {
          id: string;
          user_id: string;
          invite_code: string;
          start_date: string | null;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          invite_code: string;
          start_date?: string | null;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["couples"]["Insert"]>;
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string | null;
          display_name: string;
          color: string;
          role: MemberRole | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          couple_id?: string | null;
          display_name?: string;
          color?: string;
          role?: MemberRole | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          title: string;
          event_date: string;
          end_date: string | null;
          start_time: string | null;
          end_time: string | null;
          owner_kind: OwnerKind;
          owner_id: string | null;
          memo: string | null;
          repeat_rule: RepeatRule;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          couple_id: string;
          title: string;
          event_date: string;
          end_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          owner_kind?: OwnerKind;
          owner_id?: string | null;
          memo?: string | null;
          repeat_rule?: RepeatRule;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      anniversaries: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          title: string;
          ann_date: string;
          repeat_yearly: boolean;
          pinned_to_widget: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          couple_id: string;
          title: string;
          ann_date: string;
          repeat_yearly?: boolean;
          pinned_to_widget?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["anniversaries"]["Insert"]
        >;
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          note_date: string;
          content: string;
          author_id: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          couple_id: string;
          note_date: string;
          content?: string;
          author_id: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          content: string;
          from_id: string;
          to_id: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          couple_id: string;
          content: string;
          from_id: string;
          to_id: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          storage_path: string;
          caption: string | null;
          photo_date: string;
          attached_to_type: AttachedToType | null;
          attached_to_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          couple_id: string;
          storage_path: string;
          caption?: string | null;
          photo_date: string;
          attached_to_type?: AttachedToType | null;
          attached_to_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_couple: {
        Args: { p_start_date: string; p_display_name?: string };
        Returns: string;
      };
      join_couple: {
        Args: { p_code: string; p_display_name?: string };
        Returns: string;
      };
      auth_couple_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      unlink_couple: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
  };
}
