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
      anexos: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          nome: string
          tamanho_bytes: number | null
          tipo: string | null
          upload_por: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          nome: string
          tamanho_bytes?: number | null
          tipo?: string | null
          upload_por?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          nome?: string
          tamanho_bytes?: number | null
          tipo?: string | null
          upload_por?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_upload_por_fkey"
            columns: ["upload_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist: {
        Row: {
          adicionado_por: string | null
          cnpj: string
          created_at: string | null
          id: string
          motivo: string | null
          razao_social: string | null
        }
        Insert: {
          adicionado_por?: string | null
          cnpj: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          razao_social?: string | null
        }
        Update: {
          adicionado_por?: string | null
          cnpj?: string
          created_at?: string | null
          id?: string
          motivo?: string | null
          razao_social?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_captacao: {
        Row: {
          captacao_ativa: boolean | null
          google_maps_ativo: boolean | null
          google_maps_config: Json | null
          id: number
          instagram_ativo: boolean
          instagram_config: Json
          linkedin_ativo: boolean
          linkedin_config: Json
          receita_ativo: boolean | null
          receita_config: Json | null
          score_config: Json
          updated_at: string | null
        }
        Insert: {
          captacao_ativa?: boolean | null
          google_maps_ativo?: boolean | null
          google_maps_config?: Json | null
          id?: number
          instagram_ativo?: boolean
          instagram_config?: Json
          linkedin_ativo?: boolean
          linkedin_config?: Json
          receita_ativo?: boolean | null
          receita_config?: Json | null
          score_config?: Json
          updated_at?: string | null
        }
        Update: {
          captacao_ativa?: boolean | null
          google_maps_ativo?: boolean | null
          google_maps_config?: Json | null
          id?: number
          instagram_ativo?: boolean
          instagram_config?: Json
          linkedin_ativo?: boolean
          linkedin_config?: Json
          receita_ativo?: boolean | null
          receita_config?: Json | null
          score_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      configuracoes_ia: {
        Row: {
          dias_semana: string[] | null
          horario_fim: string | null
          horario_inicio: string | null
          id: number
          mensagem_abertura: string | null
          perguntas_qualificacao: Json | null
          reativacao: Json | null
          regras_handoff: Json | null
          updated_at: string | null
          variante_b: string | null
        }
        Insert: {
          dias_semana?: string[] | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: number
          mensagem_abertura?: string | null
          perguntas_qualificacao?: Json | null
          reativacao?: Json | null
          regras_handoff?: Json | null
          updated_at?: string | null
          variante_b?: string | null
        }
        Update: {
          dias_semana?: string[] | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: number
          mensagem_abertura?: string | null
          perguntas_qualificacao?: Json | null
          reativacao?: Json | null
          regras_handoff?: Json | null
          updated_at?: string | null
          variante_b?: string | null
        }
        Relationships: []
      }
      eventos_feed: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          texto: string
          tipo: Database["public"]["Enums"]["evento_tipo"]
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          texto: string
          tipo: Database["public"]["Enums"]["evento_tipo"]
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          texto?: string
          tipo?: Database["public"]["Enums"]["evento_tipo"]
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_feed_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_feed_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_consentimentos: {
        Row: {
          consentimento_em: string | null
          created_at: string
          id: string
          lead_id: string
          opt_out: boolean
          opt_out_em: string | null
          origem: string | null
          updated_at: string
        }
        Insert: {
          consentimento_em?: string | null
          created_at?: string
          id?: string
          lead_id: string
          opt_out?: boolean
          opt_out_em?: string | null
          origem?: string | null
          updated_at?: string
        }
        Update: {
          consentimento_em?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          opt_out?: boolean
          opt_out_em?: string | null
          origem?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          lead_id: string
          tag_id: string
        }
        Insert: {
          lead_id: string
          tag_id: string
        }
        Update: {
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bling_cliente_id: string | null
          capital_social: number | null
          cnae: string | null
          cnae_descricao: string | null
          cnpj: string | null
          created_at: string | null
          criado_em: string | null
          decisor_cargo: string | null
          decisor_email: string | null
          decisor_nome: string | null
          decisor_telefone: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_logradouro: string | null
          endereco_uf: string | null
          fonte: Database["public"]["Enums"]["lead_fonte"]
          fonte_ref: string | null
          handoff_em: string | null
          id: string
          metadata: Json
          porte: Database["public"]["Enums"]["lead_porte"] | null
          primeira_resposta_vendedor_em: string | null
          razao_social: string
          score: number | null
          site: string | null
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string | null
          temperatura: Database["public"]["Enums"]["lead_temperatura"] | null
          tempo_primeira_resposta_segundos: number | null
          ultimo_contato: string | null
          updated_at: string | null
          valor_estimado: number | null
          vendedor_id: string | null
        }
        Insert: {
          bling_cliente_id?: string | null
          capital_social?: number | null
          cnae?: string | null
          cnae_descricao?: string | null
          cnpj?: string | null
          created_at?: string | null
          criado_em?: string | null
          decisor_cargo?: string | null
          decisor_email?: string | null
          decisor_nome?: string | null
          decisor_telefone?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_logradouro?: string | null
          endereco_uf?: string | null
          fonte: Database["public"]["Enums"]["lead_fonte"]
          fonte_ref?: string | null
          handoff_em?: string | null
          id?: string
          metadata?: Json
          porte?: Database["public"]["Enums"]["lead_porte"] | null
          primeira_resposta_vendedor_em?: string | null
          razao_social: string
          score?: number | null
          site?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          temperatura?: Database["public"]["Enums"]["lead_temperatura"] | null
          tempo_primeira_resposta_segundos?: number | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Update: {
          bling_cliente_id?: string | null
          capital_social?: number | null
          cnae?: string | null
          cnae_descricao?: string | null
          cnpj?: string | null
          created_at?: string | null
          criado_em?: string | null
          decisor_cargo?: string | null
          decisor_email?: string | null
          decisor_nome?: string | null
          decisor_telefone?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_logradouro?: string | null
          endereco_uf?: string | null
          fonte?: Database["public"]["Enums"]["lead_fonte"]
          fonte_ref?: string | null
          handoff_em?: string | null
          id?: string
          metadata?: Json
          porte?: Database["public"]["Enums"]["lead_porte"] | null
          primeira_resposta_vendedor_em?: string | null
          razao_social?: string
          score?: number | null
          site?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          temperatura?: Database["public"]["Enums"]["lead_temperatura"] | null
          tempo_primeira_resposta_segundos?: number | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_solicitacoes: {
        Row: {
          detalhes: string | null
          id: string
          lead_id: string | null
          resolvida_em: string | null
          resolvida_por: string | null
          solicitada_em: string
          status: string
          tipo: string
          titular_documento: string | null
          titular_email: string
        }
        Insert: {
          detalhes?: string | null
          id?: string
          lead_id?: string | null
          resolvida_em?: string | null
          resolvida_por?: string | null
          solicitada_em?: string
          status?: string
          tipo: string
          titular_documento?: string | null
          titular_email: string
        }
        Update: {
          detalhes?: string | null
          id?: string
          lead_id?: string | null
          resolvida_em?: string | null
          resolvida_por?: string | null
          solicitada_em?: string
          status?: string
          tipo?: string
          titular_documento?: string | null
          titular_email?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          arquivo_url: string | null
          autor: Database["public"]["Enums"]["mensagem_autor"]
          autor_id: string | null
          conteudo: string
          created_at: string | null
          enviada_em: string | null
          id: string
          lead_id: string
          tipo: Database["public"]["Enums"]["mensagem_tipo"] | null
        }
        Insert: {
          arquivo_url?: string | null
          autor: Database["public"]["Enums"]["mensagem_autor"]
          autor_id?: string | null
          conteudo: string
          created_at?: string | null
          enviada_em?: string | null
          id?: string
          lead_id: string
          tipo?: Database["public"]["Enums"]["mensagem_tipo"] | null
        }
        Update: {
          arquivo_url?: string | null
          autor?: Database["public"]["Enums"]["mensagem_autor"]
          autor_id?: string | null
          conteudo?: string
          created_at?: string | null
          enviada_em?: string | null
          id?: string
          lead_id?: string
          tipo?: Database["public"]["Enums"]["mensagem_tipo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          autor_id: string | null
          conteudo: string
          created_at: string | null
          id: string
          lead_id: string
        }
        Insert: {
          autor_id?: string | null
          conteudo: string
          created_at?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          autor_id?: string | null
          conteudo?: string
          created_at?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          fechamentos_mes: number | null
          id: string
          limite_leads_abertos: number | null
          meta_mensal: number | null
          nome: string
          regiao: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          taxa_conversao: number | null
          telefone: string | null
          ticket_medio: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          fechamentos_mes?: number | null
          id: string
          limite_leads_abertos?: number | null
          meta_mensal?: number | null
          nome: string
          regiao?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          taxa_conversao?: number | null
          telefone?: string | null
          ticket_medio?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          fechamentos_mes?: number | null
          id?: string
          limite_leads_abertos?: number | null
          meta_mensal?: number | null
          nome?: string
          regiao?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          taxa_conversao?: number | null
          telefone?: string | null
          ticket_medio?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          gerado_em: string | null
          id: string
          periodo_fim: string
          periodo_inicio: string
          tamanho_bytes: number | null
          url_pdf: string | null
        }
        Insert: {
          gerado_em?: string | null
          id?: string
          periodo_fim: string
          periodo_inicio: string
          tamanho_bytes?: number | null
          url_pdf?: string | null
        }
        Update: {
          gerado_em?: string | null
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          tamanho_bytes?: number | null
          url_pdf?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_score_lead: {
        Args: { _lead: Database["public"]["Tables"]["leads"]["Row"] }
        Returns: number
      }
      get_dashboard_kpis: { Args: { periodo_dias?: number }; Returns: Json }
      get_funil_data: {
        Args: { periodo_dias?: number }
        Returns: {
          status: Database["public"]["Enums"]["lead_status"]
          total: number
        }[]
      }
      get_kpis_vendedor: { Args: { _vendedor: string }; Returns: Json }
      get_leads_aguardando_resposta: {
        Args: never
        Returns: {
          handoff_em: string
          lead_id: string
          razao_social: string
          segundos_aguardando: number
          vendedor_avatar: string
          vendedor_id: string
          vendedor_nome: string
        }[]
      }
      get_leads_por_uf: {
        Args: { periodo_dias?: number }
        Returns: {
          qualificados: number
          quentes: number
          score_medio: number
          total: number
          uf: string
        }[]
      }
      get_ranking_velocidade_vendedores: {
        Args: { periodo_dias?: number }
        Returns: {
          avatar_url: string
          nome: string
          taxa_excelencia: number
          tempo_medio_segundos: number
          total_respostas: number
          vendedor_id: string
        }[]
      }
      get_serie_captacao: {
        Args: { dias?: number }
        Returns: {
          dia: string
          total: number
        }[]
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      reprocessar_scores: { Args: never; Returns: number }
    }
    Enums: {
      evento_tipo:
        | "captacao"
        | "mensagem_ia"
        | "resposta_lead"
        | "handoff"
        | "primeira_resposta_vendedor"
        | "venda"
        | "alerta"
        | "status_change"
      lead_fonte:
        | "google_maps"
        | "receita_federal"
        | "indicacao"
        | "manual"
        | "instagram"
        | "linkedin"
      lead_porte: "ME" | "EPP" | "MEDIA" | "GRANDE"
      lead_status:
        | "bruto"
        | "abordado"
        | "respondeu"
        | "qualificado"
        | "negociacao"
        | "ganho"
        | "perdido"
      lead_temperatura: "quente" | "morno" | "frio"
      mensagem_autor: "ia" | "lead" | "vendedor"
      mensagem_tipo: "texto" | "imagem" | "arquivo"
      user_role: "vendedor" | "gestor" | "admin"
      user_status: "ativo" | "pausado"
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
      evento_tipo: [
        "captacao",
        "mensagem_ia",
        "resposta_lead",
        "handoff",
        "primeira_resposta_vendedor",
        "venda",
        "alerta",
        "status_change",
      ],
      lead_fonte: [
        "google_maps",
        "receita_federal",
        "indicacao",
        "manual",
        "instagram",
        "linkedin",
      ],
      lead_porte: ["ME", "EPP", "MEDIA", "GRANDE"],
      lead_status: [
        "bruto",
        "abordado",
        "respondeu",
        "qualificado",
        "negociacao",
        "ganho",
        "perdido",
      ],
      lead_temperatura: ["quente", "morno", "frio"],
      mensagem_autor: ["ia", "lead", "vendedor"],
      mensagem_tipo: ["texto", "imagem", "arquivo"],
      user_role: ["vendedor", "gestor", "admin"],
      user_status: ["ativo", "pausado"],
    },
  },
} as const
