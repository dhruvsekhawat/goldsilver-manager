# Gold & Silver Transaction Manager

A web application to manage and track gold and silver transactions, built with React, TypeScript, and Supabase.

## Features

- Track gold and silver purchases and sales
- Automatic FIFO calculation for selling transactions
- Monthly reports with detailed summaries
- Profile-based transaction management
- Real-time profit calculation
- Responsive design for all devices

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Database)
- React Query
- date-fns
- shadcn/ui components

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/goldsilver-manager.git
cd goldsilver-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Database Setup

Create the following table in your Supabase database:

```sql
-- Create enum types
CREATE TYPE transaction_type AS ENUM ('buy', 'sell');
CREATE TYPE metal_type AS ENUM ('gold', 'silver');

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile TEXT NOT NULL,
  type transaction_type NOT NULL,
  metal metal_type NOT NULL,
  weight DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  date DATE NOT NULL,
  remaining_weight DECIMAL,
  sold_from TEXT[],
  profit DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations
CREATE POLICY "Enable all operations for all users" ON transactions FOR ALL USING (true);
```

## Usage

1. Select or create a profile for tracking transactions
2. Add buy/sell transactions with the transaction form
3. View monthly reports and summaries
4. Track profits and inventory for both gold and silver

## License

MIT
