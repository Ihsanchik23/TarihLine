export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          record_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          record_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          record_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      border_layers: {
        Row: {
          administrative_level: string
          area_label_kk: string
          area_label_ru: string
          coverage: string
          created_at: string
          geojson_path: string
          id: string
          license: string
          priority: number
          reconstruction: boolean
          snapshot_year: number
          source_id: string
          status: string
          title_kk: string
          title_ru: string
          updated_at: string
          valid_from: number
          valid_to: number
          version: number
        }
        Insert: {
          administrative_level: string
          area_label_kk: string
          area_label_ru: string
          coverage?: string
          created_at?: string
          geojson_path: string
          id?: string
          license: string
          priority?: number
          reconstruction?: boolean
          snapshot_year: number
          source_id: string
          status?: string
          title_kk: string
          title_ru: string
          updated_at?: string
          valid_from: number
          valid_to: number
          version?: number
        }
        Update: {
          administrative_level?: string
          area_label_kk?: string
          area_label_ru?: string
          coverage?: string
          created_at?: string
          geojson_path?: string
          id?: string
          license?: string
          priority?: number
          reconstruction?: boolean
          snapshot_year?: number
          source_id?: string
          status?: string
          title_kk?: string
          title_ru?: string
          updated_at?: string
          valid_from?: number
          valid_to?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "border_layers_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      event_details: {
        Row: {
          date_precision: string
          end_date: string | null
          end_year: number | null
          record_id: string
          significance_kk: string
          significance_ru: string
          start_date: string | null
          start_year: number
        }
        Insert: {
          date_precision: string
          end_date?: string | null
          end_year?: number | null
          record_id: string
          significance_kk: string
          significance_ru: string
          start_date?: string | null
          start_year: number
        }
        Update: {
          date_precision?: string
          end_date?: string | null
          end_year?: number | null
          record_id?: string
          significance_kk?: string
          significance_ru?: string
          start_date?: string | null
          start_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_details_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: true
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_records: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description_kk: string
          description_ru: string
          id: string
          published_at: string | null
          record_type: string
          search_vector: unknown
          slug: string
          status: string
          summary_kk: string
          summary_ru: string
          title_kk: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description_kk: string
          description_ru: string
          id?: string
          published_at?: string | null
          record_type: string
          search_vector?: unknown
          slug: string
          status?: string
          summary_kk: string
          summary_ru: string
          title_kk: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_kk?: string
          description_ru?: string
          id?: string
          published_at?: string | null
          record_type?: string
          search_vector?: unknown
          slug?: string
          status?: string
          summary_kk?: string
          summary_ru?: string
          title_kk?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_errors: {
        Row: {
          column_name: string | null
          created_at: string
          error_code: string
          id: number
          import_job_id: string
          message: string
          row_number: number
        }
        Insert: {
          column_name?: string | null
          created_at?: string
          error_code: string
          id?: never
          import_job_id: string
          message: string
          row_number: number
        }
        Update: {
          column_name?: string | null
          created_at?: string
          error_code?: string
          id?: never
          import_job_id?: string
          message?: string
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          checksum: string
          created_at: string
          filename: string
          finished_at: string | null
          id: string
          imported_rows: number
          initiated_by: string
          rejected_rows: number
          started_at: string | null
          status: string
          total_rows: number
        }
        Insert: {
          checksum: string
          created_at?: string
          filename: string
          finished_at?: string | null
          id?: string
          imported_rows?: number
          initiated_by: string
          rejected_rows?: number
          started_at?: string | null
          status?: string
          total_rows?: number
        }
        Update: {
          checksum?: string
          created_at?: string
          filename?: string
          finished_at?: string | null
          id?: string
          imported_rows?: number
          initiated_by?: string
          rejected_rows?: number
          started_at?: string | null
          status?: string
          total_rows?: number
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          historical_name_kk: string | null
          historical_name_ru: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name_kk: string
          name_ru: string
          precision: string
          region_geometry_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          historical_name_kk?: string | null
          historical_name_ru?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name_kk: string
          name_ru: string
          precision: string
          region_geometry_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          historical_name_kk?: string | null
          historical_name_ru?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name_kk?: string
          name_ru?: string
          precision?: string
          region_geometry_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      map_markers: {
        Row: {
          created_at: string
          end_year: number | null
          id: string
          is_primary: boolean
          kind: string
          latitude: number | null
          location_id: string | null
          longitude: number | null
          precision: string
          record_id: string
          start_year: number
          status: string
          title_kk: string | null
          title_ru: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_year?: number | null
          id?: string
          is_primary?: boolean
          kind: string
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          precision: string
          record_id: string
          start_year: number
          status?: string
          title_kk?: string | null
          title_ru?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_year?: number | null
          id?: string
          is_primary?: boolean
          kind?: string
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          precision?: string
          record_id?: string
          start_year?: number
          status?: string
          title_kk?: string | null
          title_ru?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_markers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_markers_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      marker_sources: {
        Row: {
          citation_note: string | null
          marker_id: string
          source_id: string
        }
        Insert: {
          citation_note?: string | null
          marker_id: string
          source_id: string
        }
        Update: {
          citation_note?: string | null
          marker_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marker_sources_marker_id_fkey"
            columns: ["marker_id"]
            isOneToOne: false
            referencedRelation: "map_markers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marker_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_kk: string
          alt_ru: string
          author: string | null
          caption_kk: string
          caption_ru: string
          created_at: string
          id: string
          license: string
          media_type: string
          source_id: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          alt_kk: string
          alt_ru: string
          author?: string | null
          caption_kk: string
          caption_ru: string
          created_at?: string
          id?: string
          license: string
          media_type: string
          source_id: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          alt_kk?: string
          alt_ru?: string
          author?: string | null
          caption_kk?: string
          caption_ru?: string
          created_at?: string
          id?: string
          license?: string
          media_type?: string
          source_id?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          record_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          record_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          record_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      person_details: {
        Row: {
          biography_kk: string
          biography_ru: string
          birth_date: string | null
          birth_year: number
          death_date: string | null
          death_year: number | null
          occupation_kk: string
          occupation_ru: string
          portrait_media_id: string | null
          record_id: string
        }
        Insert: {
          biography_kk: string
          biography_ru: string
          birth_date?: string | null
          birth_year: number
          death_date?: string | null
          death_year?: number | null
          occupation_kk: string
          occupation_ru: string
          portrait_media_id?: string | null
          record_id: string
        }
        Update: {
          biography_kk?: string
          biography_ru?: string
          birth_date?: string | null
          birth_year?: number
          death_date?: string | null
          death_year?: number | null
          occupation_kk?: string
          occupation_ru?: string
          portrait_media_id?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_details_portrait_media_id_fkey"
            columns: ["portrait_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_details_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: true
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      record_media: {
        Row: {
          media_id: string
          record_id: string
          sort_order: number
        }
        Insert: {
          media_id: string
          record_id: string
          sort_order?: number
        }
        Update: {
          media_id?: string
          record_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "record_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_media_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      record_sources: {
        Row: {
          citation_note: string | null
          record_id: string
          source_id: string
        }
        Insert: {
          citation_note?: string | null
          record_id: string
          source_id: string
        }
        Update: {
          citation_note?: string | null
          record_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_sources_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      relation_sources: {
        Row: {
          citation_note: string | null
          relation_id: string
          source_id: string
        }
        Insert: {
          citation_note?: string | null
          relation_id: string
          source_id: string
        }
        Update: {
          citation_note?: string | null
          relation_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relation_sources_relation_id_fkey"
            columns: ["relation_id"]
            isOneToOne: false
            referencedRelation: "relations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relation_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      relations: {
        Row: {
          created_at: string
          explanation_kk: string
          explanation_ru: string
          from_record_id: string
          from_year: number | null
          id: string
          relation_type: string
          status: string
          to_record_id: string
          to_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation_kk: string
          explanation_ru: string
          from_record_id: string
          from_year?: number | null
          id?: string
          relation_type: string
          status?: string
          to_record_id: string
          to_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation_kk?: string
          explanation_ru?: string
          from_record_id?: string
          from_year?: number | null
          id?: string
          relation_type?: string
          status?: string
          to_record_id?: string
          to_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relations_from_record_id_fkey"
            columns: ["from_record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relations_to_record_id_fkey"
            columns: ["to_record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      route_items: {
        Row: {
          author_comment: string | null
          created_at: string
          id: string
          position: number
          record_id: string
          route_id: string
        }
        Insert: {
          author_comment?: string | null
          created_at?: string
          id?: string
          position: number
          record_id: string
          route_id: string
        }
        Update: {
          author_comment?: string | null
          created_at?: string
          id?: string
          position?: number
          record_id?: string
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_items_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "historical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_items_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          accessed_at: string | null
          author: string | null
          created_at: string
          id: string
          license: string | null
          notes: string | null
          publisher: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          accessed_at?: string | null
          author?: string | null
          created_at?: string
          id?: string
          license?: string | null
          notes?: string | null
          publisher?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          accessed_at?: string | null
          author?: string | null
          created_at?: string
          id?: string
          license?: string | null
          notes?: string | null
          publisher?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_event_draft: {
        Args: {
          p_category: string
          p_date_precision: string
          p_description_kk: string
          p_description_ru: string
          p_end_year: number | null
          p_significance_kk: string
          p_significance_ru: string
          p_slug: string
          p_source_author: string
          p_source_license: string
          p_source_publisher: string
          p_source_title: string
          p_source_url: string
          p_start_year: number
          p_summary_kk: string
          p_summary_ru: string
          p_title_kk: string
          p_title_ru: string
        }
        Returns: string
      }
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
  public: {
    Enums: {},
  },
} as const
