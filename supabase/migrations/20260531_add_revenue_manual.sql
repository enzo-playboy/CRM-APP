-- Criar tabela de receitas manuais
CREATE TABLE IF NOT EXISTS revenue_manual (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  category TEXT DEFAULT 'projeto',
  payment_method TEXT DEFAULT 'pix',
  status TEXT DEFAULT 'received',
  date DATE NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_revenue_manual_user_id ON revenue_manual(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_manual_date ON revenue_manual(date);
CREATE INDEX IF NOT EXISTS idx_revenue_manual_status ON revenue_manual(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE revenue_manual ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso (usuários só veem suas próprias receitas)
CREATE POLICY "Users can view own revenue_manual" ON revenue_manual
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revenue_manual" ON revenue_manual
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenue_manual" ON revenue_manual
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own revenue_manual" ON revenue_manual
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários na tabela
COMMENT ON TABLE revenue_manual IS 'Receitas manuais (não-Stripe) do CRM';
COMMENT ON COLUMN revenue_manual.category IS 'Projeto, Serviço, Consultoria, Recorrente, Outros';
COMMENT ON COLUMN revenue_manual.payment_method IS 'PIX, Cartão, Boleto, Transferência, Dinheiro';
COMMENT ON COLUMN revenue_manual.status IS 'pending, received, cancelled';
