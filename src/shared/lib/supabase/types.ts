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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          base_price: number
          ceo_name: string
          ceo_sprite: string
          change_percent: number
          created_at: string
          current_price: number
          description: string
          id: string
          is_active: boolean
          market_sentiment: string
          name: string
          prev_close: number
          region: string
          sector: string
          ticker: string
        }
        Insert: {
          base_price?: number
          ceo_name: string
          ceo_sprite: string
          change_percent?: number
          created_at?: string
          current_price?: number
          description: string
          id?: string
          is_active?: boolean
          market_sentiment?: string
          name: string
          prev_close?: number
          region?: string
          sector: string
          ticker: string
        }
        Update: {
          base_price?: number
          ceo_name?: string
          ceo_sprite?: string
          change_percent?: number
          created_at?: string
          current_price?: number
          description?: string
          id?: string
          is_active?: boolean
          market_sentiment?: string
          name?: string
          prev_close?: number
          region?: string
          sector?: string
          ticker?: string
        }
        Relationships: []
      }
      daily_ritual: {
        Row: {
          actual_meet_timestamp: string | null
          created_at: string | null
          date: string
          emotional_note: string | null
          evidence_urls: Json | null
          goal_1: string
          goal_2: string
          goal_3: string
          goal_4_oracle: string | null
          id: string
          items_earned: Json | null
          meet_time: string
          pkd_earned: number | null
          quiz_answer_correct: boolean | null
          quiz_question: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          actual_meet_timestamp?: string | null
          created_at?: string | null
          date?: string
          emotional_note?: string | null
          evidence_urls?: Json | null
          goal_1: string
          goal_2: string
          goal_3: string
          goal_4_oracle?: string | null
          id?: string
          items_earned?: Json | null
          meet_time: string
          pkd_earned?: number | null
          quiz_answer_correct?: boolean | null
          quiz_question?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          actual_meet_timestamp?: string | null
          created_at?: string | null
          date?: string
          emotional_note?: string | null
          evidence_urls?: Json | null
          goal_1?: string
          goal_2?: string
          goal_3?: string
          goal_4_oracle?: string | null
          id?: string
          items_earned?: Json | null
          meet_time?: string
          pkd_earned?: number | null
          quiz_answer_correct?: boolean | null
          quiz_question?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      economia_johto: {
        Row: {
          calculado_en: string
          descripcion: string
          empresas_en_crisis: number
          estado_economia: string
          id: number
          indice_inflacion: number
          multiplicador_npc: number
          variacion_promedio: number
        }
        Insert: {
          calculado_en?: string
          descripcion?: string
          empresas_en_crisis?: number
          estado_economia?: string
          id?: number
          indice_inflacion?: number
          multiplicador_npc?: number
          variacion_promedio?: number
        }
        Update: {
          calculado_en?: string
          descripcion?: string
          empresas_en_crisis?: number
          estado_economia?: string
          id?: number
          indice_inflacion?: number
          multiplicador_npc?: number
          variacion_promedio?: number
        }
        Relationships: []
      }
      empresas: {
        Row: {
          activa: boolean
          beneficios_json: Json | null
          capitalizacion_mercado: number
          ceo_nombre: string
          ceo_sprite: string
          creado_en: string
          descripcion: string
          estado_empresa: string | null
          frecuencia_perk_dias: number | null
          historia: string | null
          id: string
          logo_url: string | null
          market_cap: number | null
          max_52w: number | null
          min_52w: number | null
          nombre: string
          num_empleados: number | null
          objeto_perk_id: string | null
          precio_actual: number
          precio_base: number
          precio_cierre: number
          region: string
          sector: string
          sede_principal: string | null
          sentimiento_mercado: string | null
          shares_circulating: number | null
          tasa_dividendo: number | null
          ticker: string
          umbral_perk: number | null
          variacion_24h: number
          volumen_24h: number | null
        }
        Insert: {
          activa?: boolean
          beneficios_json?: Json | null
          capitalizacion_mercado?: number
          ceo_nombre: string
          ceo_sprite: string
          creado_en?: string
          descripcion: string
          estado_empresa?: string | null
          frecuencia_perk_dias?: number | null
          historia?: string | null
          id?: string
          logo_url?: string | null
          market_cap?: number | null
          max_52w?: number | null
          min_52w?: number | null
          nombre: string
          num_empleados?: number | null
          objeto_perk_id?: string | null
          precio_actual?: number
          precio_base?: number
          precio_cierre?: number
          region?: string
          sector: string
          sede_principal?: string | null
          sentimiento_mercado?: string | null
          shares_circulating?: number | null
          tasa_dividendo?: number | null
          ticker: string
          umbral_perk?: number | null
          variacion_24h?: number
          volumen_24h?: number | null
        }
        Update: {
          activa?: boolean
          beneficios_json?: Json | null
          capitalizacion_mercado?: number
          ceo_nombre?: string
          ceo_sprite?: string
          creado_en?: string
          descripcion?: string
          estado_empresa?: string | null
          frecuencia_perk_dias?: number | null
          historia?: string | null
          id?: string
          logo_url?: string | null
          market_cap?: number | null
          max_52w?: number | null
          min_52w?: number | null
          nombre?: string
          num_empleados?: number | null
          objeto_perk_id?: string | null
          precio_actual?: number
          precio_base?: number
          precio_cierre?: number
          region?: string
          sector?: string
          sede_principal?: string | null
          sentimiento_mercado?: string | null
          shares_circulating?: number | null
          tasa_dividendo?: number | null
          ticker?: string
          umbral_perk?: number | null
          variacion_24h?: number
          volumen_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_objeto_perk_id_fkey"
            columns: ["objeto_perk_id"]
            isOneToOne: false
            referencedRelation: "master_loot"
            referencedColumns: ["id"]
          },
        ]
      }
      equipo_pokemon_usuario: {
        Row: {
          actualizado_at: string | null
          creado_at: string | null
          es_companero: boolean | null
          es_shiny: boolean | null
          id: string
          iv_ataque: number | null
          iv_defensa: number | null
          iv_hp: number | null
          iv_sp_ataque: number | null
          iv_sp_defensa: number | null
          iv_velocidad: number | null
          mote: string | null
          nivel: number
          pokemon_id: string
          usuario_id: string
        }
        Insert: {
          actualizado_at?: string | null
          creado_at?: string | null
          es_companero?: boolean | null
          es_shiny?: boolean | null
          id?: string
          iv_ataque?: number | null
          iv_defensa?: number | null
          iv_hp?: number | null
          iv_sp_ataque?: number | null
          iv_sp_defensa?: number | null
          iv_velocidad?: number | null
          mote?: string | null
          nivel?: number
          pokemon_id: string
          usuario_id: string
        }
        Update: {
          actualizado_at?: string | null
          creado_at?: string | null
          es_companero?: boolean | null
          es_shiny?: boolean | null
          id?: string
          iv_ataque?: number | null
          iv_defensa?: number | null
          iv_hp?: number | null
          iv_sp_ataque?: number | null
          iv_sp_defensa?: number | null
          iv_velocidad?: number | null
          mote?: string | null
          nivel?: number
          pokemon_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipo_pokemon_usuario_pokemon_id_fkey"
            columns: ["pokemon_id"]
            isOneToOne: false
            referencedRelation: "master_pokemon"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed_at: string
          habit_id: string
          id: string
          notes: string | null
          pkd_earned: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          pkd_earned: number
          user_id: string
        }
        Update: {
          completed_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          pkd_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          pkd_value: number
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          pkd_value?: number
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pkd_value?: number
          user_id?: string
        }
        Relationships: []
      }
      historial_ohlc: {
        Row: {
          apertura: number
          cierre: number
          empresa_id: string
          id: string
          intervalo: string
          maximo: number
          minimo: number
          registrado_en: string
          volumen: number
        }
        Insert: {
          apertura: number
          cierre: number
          empresa_id: string
          id?: string
          intervalo?: string
          maximo: number
          minimo: number
          registrado_en?: string
          volumen?: number
        }
        Update: {
          apertura?: number
          cierre?: number
          empresa_id?: string
          id?: string
          intervalo?: string
          maximo?: number
          minimo?: number
          registrado_en?: string
          volumen?: number
        }
        Relationships: [
          {
            foreignKeyName: "historial_ohlc_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_precios: {
        Row: {
          empresa_id: string
          id: string
          precio: number
          registrado_en: string
        }
        Insert: {
          empresa_id: string
          id?: string
          precio: number
          registrado_en?: string
        }
        Update: {
          empresa_id?: string
          id?: string
          precio?: number
          registrado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_precios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_transacciones: {
        Row: {
          cantidad: number
          comision_pagada: number
          creada_en: string
          empresa_id: string
          id: string
          precio_ejecucion: number
          tipo: string
          total_neto: number
          usuario_id: string
        }
        Insert: {
          cantidad: number
          comision_pagada: number
          creada_en?: string
          empresa_id: string
          id?: string
          precio_ejecucion: number
          tipo: string
          total_neto: number
          usuario_id: string
        }
        Update: {
          cantidad?: number
          comision_pagada?: number
          creada_en?: string
          empresa_id?: string
          id?: string
          precio_ejecucion?: number
          tipo?: string
          total_neto?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_transacciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_usuario: {
        Row: {
          actualizado_at: string | null
          cantidad: number
          creado_at: string | null
          id: string
          objeto_id: string
          usuario_id: string
        }
        Insert: {
          actualizado_at?: string | null
          cantidad?: number
          creado_at?: string | null
          id?: string
          objeto_id: string
          usuario_id: string
        }
        Update: {
          actualizado_at?: string | null
          cantidad?: number
          creado_at?: string | null
          id?: string
          objeto_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_usuario_objeto_id_fkey"
            columns: ["objeto_id"]
            isOneToOne: false
            referencedRelation: "master_objetos"
            referencedColumns: ["id"]
          },
        ]
      }
      life_plan: {
        Row: {
          annual_goals: Json | null
          created_at: string | null
          financial_goal: number | null
          id: string
          last_sync_at: string | null
          next_sync_available_at: string | null
          quarterly_goals: Json | null
          routine_base: Json | null
          user_id: string
        }
        Insert: {
          annual_goals?: Json | null
          created_at?: string | null
          financial_goal?: number | null
          id?: string
          last_sync_at?: string | null
          next_sync_available_at?: string | null
          quarterly_goals?: Json | null
          routine_base?: Json | null
          user_id: string
        }
        Update: {
          annual_goals?: Json | null
          created_at?: string | null
          financial_goal?: number | null
          id?: string
          last_sync_at?: string | null
          next_sync_available_at?: string | null
          quarterly_goals?: Json | null
          routine_base?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      log_dividendos: {
        Row: {
          empresa_id: string | null
          fecha_entrega: string | null
          id: string
          monto_o_item: string | null
          tipo_recompensa: string | null
          usuario_id: string | null
        }
        Insert: {
          empresa_id?: string | null
          fecha_entrega?: string | null
          id?: string
          monto_o_item?: string | null
          tipo_recompensa?: string | null
          usuario_id?: string | null
        }
        Update: {
          empresa_id?: string | null
          fecha_entrega?: string | null
          id?: string
          monto_o_item?: string | null
          tipo_recompensa?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_dividendos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      market_news: {
        Row: {
          description: string | null
          id: string
          impact_factor: number
          is_read: boolean
          published_at: string
          sentiment: string | null
          ticker_affected: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          impact_factor?: number
          is_read?: boolean
          published_at?: string
          sentiment?: string | null
          ticker_affected: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          impact_factor?: number
          is_read?: boolean
          published_at?: string
          sentiment?: string | null
          ticker_affected?: string
          title?: string
        }
        Relationships: []
      }
      master_loot: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          rarity: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      master_objetos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_objeto"]
          creado_en: string | null
          descripcion_es: string | null
          efecto_batalla: string | null
          es_exclusivo_hns: boolean | null
          id: string
          id_interno_gba: number
          nombre_en: string
          nombre_en_slug: string
          nombre_es: string
          precio_compra: number | null
          precio_venta: number | null
          se_puede_holdear: boolean | null
          sprite_url: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_objeto"]
          creado_en?: string | null
          descripcion_es?: string | null
          efecto_batalla?: string | null
          es_exclusivo_hns?: boolean | null
          id?: string
          id_interno_gba: number
          nombre_en: string
          nombre_en_slug: string
          nombre_es: string
          precio_compra?: number | null
          precio_venta?: number | null
          se_puede_holdear?: boolean | null
          sprite_url?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_objeto"]
          creado_en?: string | null
          descripcion_es?: string | null
          efecto_batalla?: string | null
          es_exclusivo_hns?: boolean | null
          id?: string
          id_interno_gba?: number
          nombre_en?: string
          nombre_en_slug?: string
          nombre_es?: string
          precio_compra?: number | null
          precio_venta?: number | null
          se_puede_holdear?: boolean | null
          sprite_url?: string | null
        }
        Relationships: []
      }
      master_pokemon: {
        Row: {
          actualizado_en: string | null
          anime_lore: string | null
          base_stats: Json | null
          creado_en: string | null
          curiosities: string | null
          descripcion_pokedex: string | null
          disponible_johto: boolean | null
          es_starter_hns: boolean | null
          generacion: number
          habitat: string | null
          id: string
          id_interno_gba: number
          nombre_en: string
          nombre_es: string
          pokedex_nacional_id: number
          sprite_estatico_url: string | null
          sprite_url: string | null
          tipo_1: Database["public"]["Enums"]["tipo_elemental"]
          tipo_2: Database["public"]["Enums"]["tipo_elemental"] | null
        }
        Insert: {
          actualizado_en?: string | null
          anime_lore?: string | null
          base_stats?: Json | null
          creado_en?: string | null
          curiosities?: string | null
          descripcion_pokedex?: string | null
          disponible_johto?: boolean | null
          es_starter_hns?: boolean | null
          generacion?: number
          habitat?: string | null
          id?: string
          id_interno_gba: number
          nombre_en: string
          nombre_es: string
          pokedex_nacional_id: number
          sprite_estatico_url?: string | null
          sprite_url?: string | null
          tipo_1: Database["public"]["Enums"]["tipo_elemental"]
          tipo_2?: Database["public"]["Enums"]["tipo_elemental"] | null
        }
        Update: {
          actualizado_en?: string | null
          anime_lore?: string | null
          base_stats?: Json | null
          creado_en?: string | null
          curiosities?: string | null
          descripcion_pokedex?: string | null
          disponible_johto?: boolean | null
          es_starter_hns?: boolean | null
          generacion?: number
          habitat?: string | null
          id?: string
          id_interno_gba?: number
          nombre_en?: string
          nombre_es?: string
          pokedex_nacional_id?: number
          sprite_estatico_url?: string | null
          sprite_url?: string | null
          tipo_1?: Database["public"]["Enums"]["tipo_elemental"]
          tipo_2?: Database["public"]["Enums"]["tipo_elemental"] | null
        }
        Relationships: []
      }
      news_events: {
        Row: {
          description: string | null
          id: string
          published_at: string
          sentiment: string | null
          stocks_affected: Json | null
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          published_at?: string
          sentiment?: string | null
          stocks_affected?: Json | null
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          published_at?: string
          sentiment?: string | null
          stocks_affected?: Json | null
          title?: string
        }
        Relationships: []
      }
      noticias_mercado: {
        Row: {
          autor: string | null
          descripcion: string | null
          duracion_horas: number | null
          estado: string | null
          factor_impacto: number
          fue_procesada: boolean | null
          fuente: string | null
          id: string
          imagen_url: string | null
          noticia_tipo: string | null
          publicada_en: string
          region_afectada: string | null
          sector_afectado: string | null
          sentimiento: string | null
          ticker_afectado: string
          titulo: string
        }
        Insert: {
          autor?: string | null
          descripcion?: string | null
          duracion_horas?: number | null
          estado?: string | null
          factor_impacto?: number
          fue_procesada?: boolean | null
          fuente?: string | null
          id?: string
          imagen_url?: string | null
          noticia_tipo?: string | null
          publicada_en?: string
          region_afectada?: string | null
          sector_afectado?: string | null
          sentimiento?: string | null
          ticker_afectado: string
          titulo: string
        }
        Update: {
          autor?: string | null
          descripcion?: string | null
          duracion_horas?: number | null
          estado?: string | null
          factor_impacto?: number
          fue_procesada?: boolean | null
          fuente?: string | null
          id?: string
          imagen_url?: string | null
          noticia_tipo?: string | null
          publicada_en?: string
          region_afectada?: string | null
          sector_afectado?: string | null
          sentimiento?: string | null
          ticker_afectado?: string
          titulo?: string
        }
        Relationships: []
      }
      oracle_logs: {
        Row: {
          created_at: string | null
          id: string
          judgment_reason: string | null
          payload: Json | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          judgment_reason?: string | null
          payload?: Json | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          judgment_reason?: string | null
          payload?: Json | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ordenes_avanzadas: {
        Row: {
          cantidad: number
          created_at: string | null
          estado: string | null
          executed_at: string | null
          id: string
          precio_objetivo: number
          ticker: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          estado?: string | null
          executed_at?: string | null
          id?: string
          precio_objetivo: number
          ticker: string
          tipo: string
          usuario_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          estado?: string | null
          executed_at?: string | null
          id?: string
          precio_objetivo?: number
          ticker?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      ordenes_pendientes: {
        Row: {
          cantidad: number
          creada_en: string
          ejecutada_en: string | null
          empresa_id: string
          estado: string
          id: string
          precio_objetivo: number
          tipo_orden: string
          usuario_id: string
        }
        Insert: {
          cantidad: number
          creada_en?: string
          ejecutada_en?: string | null
          empresa_id: string
          estado?: string
          id?: string
          precio_objetivo: number
          tipo_orden: string
          usuario_id: string
        }
        Update: {
          cantidad?: number
          creada_en?: string
          ejecutada_en?: string | null
          empresa_id?: string
          estado?: string
          id?: string
          precio_objetivo?: number
          tipo_orden?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_pendientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_vida: {
        Row: {
          avatar_id: string | null
          edad: number | null
          fecha_ultima_actualizacion: string | null
          herramienta_primordial: string | null
          herramienta_secundaria: string | null
          id: string
          meta_anual: string | null
          meta_ingreso_mensual: number | null
          meta_trimestral: string | null
          motor_principal: string | null
          nivel_rigurosidad:
            | Database["public"]["Enums"]["nivel_rigurosidad_enum"]
            | null
          nombre_entrenador: string
          obstaculo_principal: string | null
          plan_vida_libre: string | null
          profesion_actual: string | null
          rutina_manana: string | null
          rutina_noche: string | null
          rutina_tarde: string | null
          usuario_id: string
        }
        Insert: {
          avatar_id?: string | null
          edad?: number | null
          fecha_ultima_actualizacion?: string | null
          herramienta_primordial?: string | null
          herramienta_secundaria?: string | null
          id?: string
          meta_anual?: string | null
          meta_ingreso_mensual?: number | null
          meta_trimestral?: string | null
          motor_principal?: string | null
          nivel_rigurosidad?:
            | Database["public"]["Enums"]["nivel_rigurosidad_enum"]
            | null
          nombre_entrenador: string
          obstaculo_principal?: string | null
          plan_vida_libre?: string | null
          profesion_actual?: string | null
          rutina_manana?: string | null
          rutina_noche?: string | null
          rutina_tarde?: string | null
          usuario_id: string
        }
        Update: {
          avatar_id?: string | null
          edad?: number | null
          fecha_ultima_actualizacion?: string | null
          herramienta_primordial?: string | null
          herramienta_secundaria?: string | null
          id?: string
          meta_anual?: string | null
          meta_ingreso_mensual?: number | null
          meta_trimestral?: string | null
          motor_principal?: string | null
          nivel_rigurosidad?:
            | Database["public"]["Enums"]["nivel_rigurosidad_enum"]
            | null
          nombre_entrenador?: string
          obstaculo_principal?: string | null
          plan_vida_libre?: string | null
          profesion_actual?: string | null
          rutina_manana?: string | null
          rutina_noche?: string | null
          rutina_tarde?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      portafolio_usuario: {
        Row: {
          actualizado_en: string
          cantidad: number
          empresa_id: string
          id: string
          precio_promedio: number
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          cantidad?: number
          empresa_id: string
          id?: string
          precio_promedio?: number
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          cantidad?: number
          empresa_id?: string
          id?: string
          precio_promedio?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portafolio_usuario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      portafolios: {
        Row: {
          cantidad: number | null
          costo_promedio: number | null
          id: string
          ticker: string
          usuario_id: string
        }
        Insert: {
          cantidad?: number | null
          costo_promedio?: number | null
          id?: string
          ticker: string
          usuario_id: string
        }
        Update: {
          cantidad?: number | null
          costo_promedio?: number | null
          id?: string
          ticker?: string
          usuario_id?: string
        }
        Relationships: []
      }
      precios_tienda_johto: {
        Row: {
          actualizado_en: string
          afectado_por_mercado: boolean
          id_interno_gba: number
          nombre_es: string
          precio_actual: number
          precio_base: number
          precio_max: number
          precio_min: number
        }
        Insert: {
          actualizado_en?: string
          afectado_por_mercado?: boolean
          id_interno_gba: number
          nombre_es: string
          precio_actual?: number
          precio_base?: number
          precio_max?: number
          precio_min?: number
        }
        Update: {
          actualizado_en?: string
          afectado_por_mercado?: boolean
          id_interno_gba?: number
          nombre_es?: string
          precio_actual?: number
          precio_base?: number
          precio_max?: number
          precio_min?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badges: number
          created_at: string
          current_save_url: string | null
          current_target_gym: number | null
          defeated_in_run: Json | null
          display_name: string
          game_flags: Json | null
          game_vars: Json | null
          gauntlet_active_run: boolean | null
          id: string
          last_save_time: string | null
          pkd_balance: number
          updated_at: string
          xp: number | null
        }
        Insert: {
          badges?: number
          created_at?: string
          current_save_url?: string | null
          current_target_gym?: number | null
          defeated_in_run?: Json | null
          display_name?: string
          game_flags?: Json | null
          game_vars?: Json | null
          gauntlet_active_run?: boolean | null
          id: string
          last_save_time?: string | null
          pkd_balance?: number
          updated_at?: string
          xp?: number | null
        }
        Update: {
          badges?: number
          created_at?: string
          current_save_url?: string | null
          current_target_gym?: number | null
          defeated_in_run?: Json | null
          display_name?: string
          game_flags?: Json | null
          game_vars?: Json | null
          gauntlet_active_run?: boolean | null
          id?: string
          last_save_time?: string | null
          pkd_balance?: number
          updated_at?: string
          xp?: number | null
        }
        Relationships: []
      }
      reward_queue: {
        Row: {
          claimed_at: string | null
          created_at: string
          id: string
          is_claimed: boolean
          payload: Json
          reward_type: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          payload: Json
          reward_type: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          payload?: Json
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          company_id: string
          id: string
          price: number
          recorded_at: string
        }
        Insert: {
          company_id: string
          id?: string
          price: number
          recorded_at?: string
        }
        Update: {
          company_id?: string
          id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          ceo_name: string
          ceo_sprite: string
          ceo_title: string
          change_percent: number
          created_at: string
          current_price: number
          id: string
          is_active: boolean
          logo_url: string | null
          lore: string
          name: string
          prev_close: number
          region: string
          sector: string
          ticker: string
        }
        Insert: {
          ceo_name: string
          ceo_sprite: string
          ceo_title: string
          change_percent?: number
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          lore: string
          name: string
          prev_close?: number
          region?: string
          sector: string
          ticker: string
        }
        Update: {
          ceo_name?: string
          ceo_sprite?: string
          ceo_title?: string
          change_percent?: number
          created_at?: string
          current_price?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          lore?: string
          name?: string
          prev_close?: number
          region?: string
          sector?: string
          ticker?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string | null
          id: string
          is_active: boolean | null
          loot_id: string
          quantity: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          id?: string
          is_active?: boolean | null
          loot_id: string
          quantity?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          id?: string
          is_active?: boolean | null
          loot_id?: string
          quantity?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_loot_id_fkey"
            columns: ["loot_id"]
            isOneToOne: false
            referencedRelation: "master_loot"
            referencedColumns: ["id"]
          },
        ]
      }
      user_portfolio: {
        Row: {
          avg_price: number
          company_id: string
          id: string
          shares: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          company_id: string
          id?: string
          shares?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          company_id?: string
          id?: string
          shares?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_portfolio_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_status: {
        Row: {
          created_at: string | null
          current_streak: number | null
          ether_battery: number | null
          is_onboarding_completed: boolean | null
          last_pokemon_gift_at: string | null
          last_ritual_date: string | null
          trading_locked_until: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          ether_battery?: number | null
          is_onboarding_completed?: boolean | null
          last_pokemon_gift_at?: string | null
          last_ritual_date?: string | null
          trading_locked_until?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          ether_battery?: number | null
          is_onboarding_completed?: boolean | null
          last_pokemon_gift_at?: string | null
          last_ritual_date?: string | null
          trading_locked_until?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          added_at: string
          company_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          company_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          company_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_impacto_noticia: {
        Args: { p_noticia_id: string }
        Returns: undefined
      }
      calcular_indice_economia: { Args: never; Returns: Json }
      fn_aplicar_penalidad: {
        Args: { p_motivo?: string; p_tipo: string; p_user_id: string }
        Returns: Json
      }
      fn_aplicar_sancion: {
        Args: { p_hp_loss: number; p_set_coma?: boolean; p_user_id: string }
        Returns: Json
      }
      fn_consultar_recompensas: {
        Args: { p_rarity?: string }
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          name: string
          rarity: string
        }[]
      }
      fn_consultar_recompensas_oraculo: {
        Args: { p_nivel_recompensa: number; p_user_id: string }
        Returns: Json
      }
      fn_leer_plan_vida: {
        Args: { p_user_id: string }
        Returns: {
          annual_goals: Json
          financial_goal: number
          last_sync_at: string
          next_sync_available_at: string
          quarterly_goals: Json
          routine_base: Json
        }[]
      }
      fn_procesar_dividendos_usuario: {
        Args: { p_user_id: string }
        Returns: Json
      }
      fn_recompensar_disciplina:
        | {
            Args: {
              p_item_id?: string
              p_item_qty?: number
              p_pkd: number
              p_user_id: string
              p_xp: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_item_id?: string
              p_item_qty?: number
              p_pkd: number
              p_pokemon_id?: number
              p_user_id: string
              p_xp: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_item_id?: string
              p_item_qty?: number
              p_pkd: number
              p_pokemon_id?: number
              p_reason: string
              p_user_id: string
              p_xp: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_es_shiny?: boolean
              p_item_id?: string
              p_item_qty?: number
              p_pkd: number
              p_pokemon_id?: number
              p_reason: string
              p_user_id: string
              p_xp: number
            }
            Returns: Json
          }
      get_economia_johto: { Args: never; Returns: Json }
      simular_tick_mercado: { Args: never; Returns: undefined }
      tick_mercado_adaptativo: { Args: { p_modo?: string }; Returns: Json }
    }
    Enums: {
      categoria_objeto:
        | "Medicina"
        | "Poké Ball"
        | "Batalla"
        | "Bayas"
        | "Objeto Clave"
        | "MTs/COs"
        | "Correo"
        | "Held Item"
        | "HnS Especial"
      nivel_rigurosidad_enum: "COZY" | "ENTRENADOR" | "NUZLOCKE"
      tipo_elemental:
        | "Normal"
        | "Fuego"
        | "Agua"
        | "Eléctrico"
        | "Planta"
        | "Hielo"
        | "Lucha"
        | "Veneno"
        | "Tierra"
        | "Volador"
        | "Psíquico"
        | "Bicho"
        | "Roca"
        | "Fantasma"
        | "Dragón"
        | "Siniestro"
        | "Acero"
        | "Hada"
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
      categoria_objeto: [
        "Medicina",
        "Poké Ball",
        "Batalla",
        "Bayas",
        "Objeto Clave",
        "MTs/COs",
        "Correo",
        "Held Item",
        "HnS Especial",
      ],
      nivel_rigurosidad_enum: ["COZY", "ENTRENADOR", "NUZLOCKE"],
      tipo_elemental: [
        "Normal",
        "Fuego",
        "Agua",
        "Eléctrico",
        "Planta",
        "Hielo",
        "Lucha",
        "Veneno",
        "Tierra",
        "Volador",
        "Psíquico",
        "Bicho",
        "Roca",
        "Fantasma",
        "Dragón",
        "Siniestro",
        "Acero",
        "Hada",
      ],
    },
  },
} as const

