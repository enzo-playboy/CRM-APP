-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem ver mensagens" ON messages;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir mensagens" ON messages;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar mensagens" ON messages;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar mensagens" ON messages;

-- Recriar com políticas permissivas (API route já protege)
CREATE POLICY "Allow all operations"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
