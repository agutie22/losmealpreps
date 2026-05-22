CREATE TABLE public.deploy_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE public.deploy_triggers ENABLE ROW LEVEL SECURITY;

-- Allow admins to insert
CREATE POLICY "Admins can trigger deploys" ON public.deploy_triggers
  FOR INSERT WITH CHECK (public.is_admin(auth.jwt()->>'email'));

-- Allow admins to read their own triggers (or all) to show last deployed time
CREATE POLICY "Admins can view deploys" ON public.deploy_triggers
  FOR SELECT USING (public.is_admin(auth.jwt()->>'email'));
