
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "apiaries": {
                  Row: {
                    "altitude_m": number | null,"created_at": string,"created_by": string,"deleted_at": string | null,"farm_name": string | null,"flora_notes": string | null,"id": string,"latitude": number | null,"longitude": number | null,"name": string,"notes": string | null,"organization_id": string,"place": string | null,"updated_at": string,"water_source": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "altitude_m"?: number | null,"created_at"?: string,"created_by": string,"deleted_at"?: string | null,"farm_name"?: string | null,"flora_notes"?: string | null,"id": string,"latitude"?: number | null,"longitude"?: number | null,"name": string,"notes"?: string | null,"organization_id": string,"place"?: string | null,"updated_at"?: string,"water_source"?: string | null
                  }
                  Update: {
                    "altitude_m"?: number | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"farm_name"?: string | null,"flora_notes"?: string | null,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"name"?: string,"notes"?: string | null,"organization_id"?: string,"place"?: string | null,"updated_at"?: string,"water_source"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "apiaries_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "apiaries_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"hive_events": {
                  Row: {
                    "created_at": string,"created_by": string,"deleted_at": string | null,"details": NonNullable<Json>,"hive_id": string,"id": string,"inspection_id": string | null,"occurred_at": string,"organization_id": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"deleted_at"?: string | null,"details"?: NonNullable<Json>,"hive_id": string,"id": string,"inspection_id"?: string | null,"occurred_at": string,"organization_id": string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"details"?: NonNullable<Json>,"hive_id"?: string,"id"?: string,"inspection_id"?: string | null,"occurred_at"?: string,"organization_id"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hive_events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hive_events_hive_id_fkey"
      columns: ["hive_id"]
isOneToOne: false
      referencedRelation: "hives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hive_events_inspection_id_fkey"
      columns: ["inspection_id"]
isOneToOne: false
      referencedRelation: "inspections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hive_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"hives": {
                  Row: {
                    "apiary_id": string,"bee_race": string | null,"brood_boxes": number | null,"colony_origin": string | null,"colony_started_on": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"hive_type": string | null,"id": string,"name": string,"notes": string | null,"organization_id": string,"qr_code": string,"queen_color": string | null,"queen_marked": boolean | null,"queen_origin": string | null,"queen_year": number | null,"status": string,"supers": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apiary_id": string,"bee_race"?: string | null,"brood_boxes"?: number | null,"colony_origin"?: string | null,"colony_started_on"?: string | null,"created_at"?: string,"created_by": string,"deleted_at"?: string | null,"hive_type"?: string | null,"id": string,"name": string,"notes"?: string | null,"organization_id": string,"qr_code": string,"queen_color"?: string | null,"queen_marked"?: boolean | null,"queen_origin"?: string | null,"queen_year"?: number | null,"status"?: string,"supers"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "apiary_id"?: string,"bee_race"?: string | null,"brood_boxes"?: number | null,"colony_origin"?: string | null,"colony_started_on"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"hive_type"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"organization_id"?: string,"qr_code"?: string,"queen_color"?: string | null,"queen_marked"?: boolean | null,"queen_origin"?: string | null,"queen_year"?: number | null,"status"?: string,"supers"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hives_apiary_id_fkey"
      columns: ["apiary_id"]
isOneToOne: false
      referencedRelation: "apiaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hives_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hives_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"inspections": {
                  Row: {
                    "attention_level": string | null,"brood_frames": number | null,"brood_pattern": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"disease_signs": (string)[] | null,"eggs_seen": string | null,"hive_id": string,"honey_frames": number | null,"id": string,"inspected_at": string,"inspected_by": string,"larvae_seen": string | null,"next_inspection_on": string | null,"notes": string | null,"organization_id": string,"pests": (string)[] | null,"planned_actions": (string)[] | null,"pollen_frames": number | null,"population_strength": number | null,"queen_cells": string | null,"queen_seen": string | null,"source": string,"stores": string | null,"temperament": number | null,"temperature_c": number | null,"transcript": string | null,"updated_at": string,"varroa_count": number | null,"varroa_method": string | null,"varroa_sample_size": number | null,"weather": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attention_level"?: string | null,"brood_frames"?: number | null,"brood_pattern"?: string | null,"created_at"?: string,"created_by": string,"deleted_at"?: string | null,"disease_signs"?: (string)[] | null,"eggs_seen"?: string | null,"hive_id": string,"honey_frames"?: number | null,"id": string,"inspected_at": string,"inspected_by"?: string,"larvae_seen"?: string | null,"next_inspection_on"?: string | null,"notes"?: string | null,"organization_id": string,"pests"?: (string)[] | null,"planned_actions"?: (string)[] | null,"pollen_frames"?: number | null,"population_strength"?: number | null,"queen_cells"?: string | null,"queen_seen"?: string | null,"source": string,"stores"?: string | null,"temperament"?: number | null,"temperature_c"?: number | null,"transcript"?: string | null,"updated_at"?: string,"varroa_count"?: number | null,"varroa_method"?: string | null,"varroa_sample_size"?: number | null,"weather"?: string | null
                  }
                  Update: {
                    "attention_level"?: string | null,"brood_frames"?: number | null,"brood_pattern"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"disease_signs"?: (string)[] | null,"eggs_seen"?: string | null,"hive_id"?: string,"honey_frames"?: number | null,"id"?: string,"inspected_at"?: string,"inspected_by"?: string,"larvae_seen"?: string | null,"next_inspection_on"?: string | null,"notes"?: string | null,"organization_id"?: string,"pests"?: (string)[] | null,"planned_actions"?: (string)[] | null,"pollen_frames"?: number | null,"population_strength"?: number | null,"queen_cells"?: string | null,"queen_seen"?: string | null,"source"?: string,"stores"?: string | null,"temperament"?: number | null,"temperature_c"?: number | null,"transcript"?: string | null,"updated_at"?: string,"varroa_count"?: number | null,"varroa_method"?: string | null,"varroa_sample_size"?: number | null,"weather"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "inspections_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inspections_hive_id_fkey"
      columns: ["hive_id"]
isOneToOne: false
      referencedRelation: "hives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inspections_inspected_by_fkey"
      columns: ["inspected_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inspections_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_invites": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"code_hash": string,"created_at": string,"expires_at": string,"id": string,"invited_by": string,"label": string | null,"organization_id": string,"revoked_at": string | null,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"code_hash": string,"created_at"?: string,"expires_at": string,"id"?: string,"invited_by": string,"label"?: string | null,"organization_id": string,"revoked_at"?: string | null,"role": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"code_hash"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string,"label"?: string | null,"organization_id"?: string,"revoked_at"?: string | null,"role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_invites_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_invites_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_invites_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_members": {
                  Row: {
                    "created_at": string,"organization_id": string,"role": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"organization_id": string,"role": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"organization_id"?: string,"role"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"deleted_at"?: string | null,"id": string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"photos": {
                  Row: {
                    "bytes": number | null,"caption": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"height": number | null,"hive_id": string,"id": string,"inspection_id": string | null,"organization_id": string,"storage_path": string,"taken_at": string,"updated_at": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes"?: number | null,"caption"?: string | null,"created_at"?: string,"created_by": string,"deleted_at"?: string | null,"height"?: number | null,"hive_id": string,"id": string,"inspection_id"?: string | null,"organization_id": string,"storage_path": string,"taken_at": string,"updated_at"?: string,"width"?: number | null
                  }
                  Update: {
                    "bytes"?: number | null,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"height"?: number | null,"hive_id"?: string,"id"?: string,"inspection_id"?: string | null,"organization_id"?: string,"storage_path"?: string,"taken_at"?: string,"updated_at"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "photos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_hive_id_fkey"
      columns: ["hive_id"]
isOneToOne: false
      referencedRelation: "hives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_inspection_id_fkey"
      columns: ["inspection_id"]
isOneToOne: false
      referencedRelation: "inspections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"deactivated_at": string | null,"display_name": string | null,"email": string,"id": string,"is_platform_admin": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deactivated_at"?: string | null,"display_name"?: string | null,"email": string,"id": string,"is_platform_admin"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deactivated_at"?: string | null,"display_name"?: string | null,"email"?: string,"id"?: string,"is_platform_admin"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "hive_open_tasks": {
                  Row: {
                    "hive_id": string,"inspected_at": string,"organization_id": string,"planned_actions": (string)[] | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "inspections_hive_id_fkey"
      columns: ["hive_id"]
isOneToOne: false
      referencedRelation: "hives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inspections_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "accept_invite":
{ Args: { "p_code": string }; Returns: string
                           },
"admin_add_member":
{ Args: { "p_organization_id": string,"p_role": string,"p_user_id": string }; Returns: undefined
                           },
"admin_list_organizations":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_search"?: string }; Returns: {
              "apiaries": number,"created_at": string,"deleted_at": string,"hives_active": number,"id": string,"inspections_30d": number,"last_inspection_at": string,"members": number,"name": string,"owner_emails": (string)[],"total_count": number
            }[]
                           },
"admin_list_users":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_search"?: string }; Returns: {
              "created_at": string,"deactivated_at": string,"display_name": string,"email": string,"id": string,"is_platform_admin": boolean,"organizations": Json,"total_count": number
            }[]
                           },
"admin_organization_summary":
{ Args: { "p_organization_id": string }; Returns: Json
                           },
"admin_provision_member":
{ Args: { "p_actor_id": string,"p_display_name": string,"p_organization_id": string,"p_organization_name": string,"p_role": string,"p_user_id": string }; Returns: string
                           },
"admin_remove_member":
{ Args: { "p_organization_id": string,"p_user_id": string }; Returns: undefined
                           },
"admin_set_deactivated":
{ Args: { "p_actor_id": string,"p_user_id": string,"p_value": boolean }; Returns: undefined
                           },
"admin_set_display_name":
{ Args: { "p_display_name": string,"p_user_id": string }; Returns: undefined
                           },
"admin_set_member_role":
{ Args: { "p_organization_id": string,"p_role": string,"p_user_id": string }; Returns: undefined
                           },
"admin_set_platform_admin":
{ Args: { "p_user_id": string,"p_value": boolean }; Returns: undefined
                           },
"admin_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"create_invite":
{ Args: { "p_label"?: string,"p_organization_id": string,"p_role": string }; Returns: {
              "code": string,"expires_at": string,"invite_id": string
            }[]
                           },
"create_organization":
{ Args: { "p_id": string,"p_name": string }; Returns: string
                           },
"hive_timeline":
{ Args: { "p_before"?: string,"p_before_id"?: string,"p_hive_id": string,"p_limit"?: number }; Returns: {
              "at": string,"author_name": string,"created_by": string,"data": Json,"id": string,"kind": string
            }[]
                           },
"my_memberships":
{ Args: Record<PropertyKey, never>; Returns: {
              "organization_id": string,"organization_name": string,"role": string
            }[]
                           },
"remove_member":
{ Args: { "p_organization_id": string,"p_user_id": string }; Returns: undefined
                           },
"revoke_invite":
{ Args: { "p_invite_id": string }; Returns: undefined
                           },
"set_member_role":
{ Args: { "p_organization_id": string,"p_role": string,"p_user_id": string }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
