-- 1. Create table ksm_licenses
CREATE TABLE public.ksm_licenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hwid text NOT NULL,
    app_name text NOT NULL,
    client_name text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ksm_licenses_pkey PRIMARY KEY (id),
    CONSTRAINT ksm_licenses_hwid_app_name_key UNIQUE (hwid, app_name)
);

-- 2. Enable RLS
ALTER TABLE public.ksm_licenses ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow public insert ONLY if needed, but it's safer to only allow Authenticated (Admin) 
-- to manage licenses via the Dashboard.
CREATE POLICY "Allow full access to authenticated users" 
ON public.ksm_licenses 
FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Allow anon read access ONLY if filtering by specific hwid/app_name (Optional, 
-- but we will use Edge Functions with Service Role to bypass RLS safely).
CREATE POLICY "Allow anon read by hwid" 
ON public.ksm_licenses 
FOR SELECT TO anon 
USING (true);
