-- Create an enum for transaction types
CREATE TYPE transaction_type AS ENUM ('buy', 'sell');
CREATE TYPE metal_type AS ENUM ('gold', 'silver');

-- Create the transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type transaction_type NOT NULL,
    metal metal_type NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    remaining_weight DECIMAL(10,2),
    sold_from UUID[] DEFAULT '{}',
    profit DECIMAL(10,2),
    profile TEXT NOT NULL DEFAULT 'Default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_metal ON transactions(metal);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_profile ON transactions(profile);

-- Set up Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since we're not using auth)
CREATE POLICY "Allow all operations" ON transactions
    FOR ALL
    USING (true)
    WITH CHECK (true); 