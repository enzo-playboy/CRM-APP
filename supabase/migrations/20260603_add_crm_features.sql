-- Colunas extras para leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Criação da tabela metas (goals) se não existir
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  monthly_leads_goal INTEGER DEFAULT 0,
  daily_leads_goal INTEGER DEFAULT 0,
  revenue_goal NUMERIC DEFAULT 0,
  projects_goal INTEGER DEFAULT 0,
  response_time_goal NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_month_year UNIQUE (user_id, month, year)
);

-- Coluna de vínculo de despesa com lead/cliente
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
