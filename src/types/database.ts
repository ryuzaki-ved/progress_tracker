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
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stocks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          weight: number
          color: string
          icon: string | null
          category: string | null
          volatility_score: number | null
          momentum_score: number | null
          current_score: number | null
          last_activity_at: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          weight?: number
          color?: string
          icon?: string | null
          category?: string | null
          volatility_score?: number | null
          momentum_score?: number | null
          current_score?: number | null
          last_activity_at?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          weight?: number
          color?: string
          icon?: string | null
          category?: string | null
          volatility_score?: number | null
          momentum_score?: number | null
          current_score?: number | null
          last_activity_at?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          stock_id: string
          title: string
          description: string | null
          type: string
          priority: string
          complexity: number | null
          estimated_duration: number | null
          points: number | null
          due_date: string | null
          status: string
          completed_at: string | null
          skipped_at: string | null
          cancelled_at: string | null
          recurring_pattern: Json | null
          parent_task_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stock_id: string
          title: string
          description?: string | null
          type?: string
          priority?: string
          complexity?: number | null
          estimated_duration?: number | null
          points?: number | null
          due_date?: string | null
          status?: string
          completed_at?: string | null
          skipped_at?: string | null
          cancelled_at?: string | null
          recurring_pattern?: Json | null
          parent_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stock_id?: string
          title?: string
          description?: string | null
          type?: string
          priority?: string
          complexity?: number | null
          estimated_duration?: number | null
          points?: number | null
          due_date?: string | null
          status?: string
          completed_at?: string | null
          skipped_at?: string | null
          cancelled_at?: string | null
          recurring_pattern?: Json | null
          parent_task_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      index_history: {
        Row: {
          id: string
          user_id: string
          date: string
          index_value: number
          daily_change: number | null
          change_percent: number | null
          commentary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          index_value: number
          daily_change?: number | null
          change_percent?: number | null
          commentary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          index_value?: number
          daily_change?: number | null
          change_percent?: number | null
          commentary?: string | null
          created_at?: string
        }
      }
      stock_performance_history: {
        Row: {
          id: string
          stock_id: string
          date: string
          daily_score: number
          score_delta: number | null
          delta_percent: number | null
          tasks_completed: number | null
          tasks_overdue: number | null
          points_earned: number | null
          created_at: string
        }
        Insert: {
          id?: string
          stock_id: string
          date: string
          daily_score: number
          score_delta?: number | null
          delta_percent?: number | null
          tasks_completed?: number | null
          tasks_overdue?: number | null
          points_earned?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          stock_id?: string
          date?: string
          daily_score?: number
          score_delta?: number | null
          delta_percent?: number | null
          tasks_completed?: number | null
          tasks_overdue?: number | null
          points_earned?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_user_index: {
        Args: {
          user_uuid: string
        }
        Returns: number
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