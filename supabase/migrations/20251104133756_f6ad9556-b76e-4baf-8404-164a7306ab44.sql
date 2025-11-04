-- Create enum for item status
CREATE TYPE item_status AS ENUM ('building', 'built', 'delivering', 'in_room');

-- Create floors table
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_number TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID REFERENCES floors(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(floor_id, room_number)
);

-- Create items table (the stock/materials)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL,
  description TEXT,
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_assigned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create item_assignments table (tracks which items are in which rooms)
CREATE TABLE item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  status item_status DEFAULT 'building',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create item_transfers table (tracks movement between rooms)
CREATE TABLE item_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES item_assignments(id) ON DELETE CASCADE NOT NULL,
  from_room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  to_room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  transferred_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT
);

-- Enable RLS
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now since it's internal company use)
CREATE POLICY "Allow public read on floors" ON floors FOR SELECT USING (true);
CREATE POLICY "Allow public insert on floors" ON floors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on floors" ON floors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on floors" ON floors FOR DELETE USING (true);

CREATE POLICY "Allow public read on rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rooms" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on rooms" ON rooms FOR DELETE USING (true);

CREATE POLICY "Allow public read on items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on items" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on items" ON items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on items" ON items FOR DELETE USING (true);

CREATE POLICY "Allow public read on item_assignments" ON item_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on item_assignments" ON item_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on item_assignments" ON item_assignments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on item_assignments" ON item_assignments FOR DELETE USING (true);

CREATE POLICY "Allow public read on item_transfers" ON item_transfers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on item_transfers" ON item_transfers FOR INSERT WITH CHECK (true);

-- Insert initial floors data
INSERT INTO floors (floor_number, display_name) VALUES
  ('7', 'Floor 7'),
  ('5W', 'Floor 5 West'),
  ('5C', 'Floor 5 Centre'),
  ('5E', 'Floor 5 East'),
  ('3W', 'Floor 3 West'),
  ('3C', 'Floor 3 Center'),
  ('3E', 'Floor 3 East'),
  ('1C', 'Floor 1 Center'),
  ('1E', 'Floor 1 East'),
  ('6B', 'Floor 6 Bar Room');

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_item_assignments_updated_at
BEFORE UPDATE ON item_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();