-- Create table for needed items that aren't on site yet
CREATE TABLE public.needed_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fulfilled BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.needed_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read on needed_items" 
ON public.needed_items 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on needed_items" 
ON public.needed_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on needed_items" 
ON public.needed_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on needed_items" 
ON public.needed_items 
FOR DELETE 
USING (true);