-- Criar tabela messages para o CRM
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL DEFAULT 'chat' CHECK (channel IN ('whatsapp', 'email', 'chat', 'n8n')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Criar RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem ver mensagens"
  ON messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir mensagens"
  ON messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar mensagens"
  ON messages FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar mensagens"
  ON messages FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comentário na tabela
COMMENT ON TABLE messages IS 'Mensagens do CRM - Histórico de conversas com contatos';
