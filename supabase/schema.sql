 and browser reports: 

ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY 'User data access' ON market_data
  USING (auth.uid() = user_id);

-- Similar for other tables 