
CREATE TYPE public.app_role AS ENUM ('admin','senior_officer','officer','auditor');
CREATE TYPE public.classification AS ENUM ('PUBLIC','INTERNAL','CONFIDENTIAL','HIGHLY_CONFIDENTIAL','RESTRICTED_EVIDENCE');
CREATE TYPE public.account_status AS ENUM ('ACTIVE','DISABLED','LOCKED','PENDING');
CREATE TYPE public.case_status AS ENUM ('OPEN','UNDER_INVESTIGATION','LEGAL_REVIEW','CLOSED','ARCHIVED');

CREATE OR REPLACE FUNCTION public.classification_level(c public.classification)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE c
    WHEN 'PUBLIC' THEN 1
    WHEN 'INTERNAL' THEN 2
    WHEN 'CONFIDENTIAL' THEN 3
    WHEN 'HIGHLY_CONFIDENTIAL' THEN 4
    WHEN 'RESTRICTED_EVIDENCE' THEN 5
  END
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  department text NOT NULL DEFAULT 'Investigation',
  designation text NOT NULL DEFAULT 'Officer',
  office text NOT NULL DEFAULT 'Head Office',
  clearance_level int NOT NULL DEFAULT 2,
  status public.account_status NOT NULL DEFAULT 'ACTIVE',
  passkey_registered boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.my_clearance()
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT clearance_level FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'), 0)
$$;

CREATE POLICY "own profile readable" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'senior_officer'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  classification public.classification NOT NULL DEFAULT 'CONFIDENTIAL',
  status public.case_status NOT NULL DEFAULT 'OPEN',
  office text NOT NULL DEFAULT 'Head Office',
  risk_score int NOT NULL DEFAULT 0,
  opened_on date NOT NULL DEFAULT current_date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cases readable by clearance" ON public.cases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.my_clearance() >= public.classification_level(classification));
CREATE POLICY "cases insert by officers" ON public.cases FOR INSERT TO authenticated
  WITH CHECK (public.my_clearance() >= 3);
CREATE POLICY "cases update by seniors" ON public.cases FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'senior_officer') OR created_by = auth.uid())
  WITH CHECK (true);

CREATE TABLE public.case_officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capacity text NOT NULL DEFAULT 'Investigating Officer',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_officers TO authenticated;
GRANT ALL ON public.case_officers TO service_role;
ALTER TABLE public.case_officers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case officers readable" ON public.case_officers FOR SELECT TO authenticated USING (true);
CREATE POLICY "case officers managed by seniors" ON public.case_officers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'senior_officer'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'senior_officer'));

CREATE TABLE public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  evidence_number text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  classification public.classification NOT NULL DEFAULT 'CONFIDENTIAL',
  file_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  sha256 text NOT NULL,
  version text NOT NULL DEFAULT 'v1.0',
  tags text[] NOT NULL DEFAULT '{}',
  frozen boolean NOT NULL DEFAULT false,
  integrity_ok boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_office text NOT NULL DEFAULT 'Head Office',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, evidence_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
GRANT ALL ON public.evidence TO service_role;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence readable by clearance" ON public.evidence FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.my_clearance() >= public.classification_level(classification));
CREATE POLICY "evidence insert by cleared staff" ON public.evidence FOR INSERT TO authenticated
  WITH CHECK (public.my_clearance() >= public.classification_level(classification));
CREATE POLICY "evidence update by seniors" ON public.evidence FOR UPDATE TO authenticated
  USING (NOT frozen AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'senior_officer') OR uploaded_by = auth.uid()))
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.block_frozen_evidence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.frozen AND NEW.frozen THEN
    RAISE EXCEPTION 'Evidence is frozen and cannot be modified';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER evidence_freeze_guard BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.block_frozen_evidence();

CREATE TABLE public.custody_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  evidence_id uuid REFERENCES public.evidence(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT 'System',
  action text NOT NULL,
  office text NOT NULL DEFAULT 'Head Office',
  reason text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT 'SUCCESS',
  hash_at_event text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.custody_events TO authenticated;
GRANT ALL ON public.custody_events TO service_role;
ALTER TABLE public.custody_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custody readable" ON public.custody_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "custody append only" ON public.custody_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  identifier text NOT NULL DEFAULT '',
  level_1_otp boolean NOT NULL DEFAULT false,
  level_2_passkey boolean NOT NULL DEFAULT false,
  level_3_credentials boolean NOT NULL DEFAULT false,
  result text NOT NULL DEFAULT 'PENDING',
  device text NOT NULL DEFAULT '',
  ip_hint text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login events readable" ON public.login_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "login events append" ON public.login_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.registered_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL,
  device_label text NOT NULL DEFAULT 'This device',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, credential_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registered_devices TO authenticated;
GRANT ALL ON public.registered_devices TO service_role;
ALTER TABLE public.registered_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own devices" ON public.registered_devices FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.case_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  occurred_on date NOT NULL,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'MANUAL',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_timeline TO authenticated;
GRANT ALL ON public.case_timeline TO service_role;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline readable with case" ON public.case_timeline FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id));
CREATE POLICY "timeline insert" ON public.case_timeline FOR INSERT TO authenticated WITH CHECK (public.my_clearance() >= 2);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, employee_id, full_name, email, department, designation, office, clearance_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP-' || upper(substr(replace(NEW.id::text,'-',''),1,6))),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Investigation'),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Investigating Officer'),
    COALESCE(NEW.raw_user_meta_data->>'office', 'Head Office'),
    COALESCE((NEW.raw_user_meta_data->>'clearance_level')::int, 3)
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'officer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.cases (case_number, title, summary, classification, status, office, risk_score, opened_on) VALUES
('CASE-2026-001','Cross-border financial routing through shell entities','Suspected layering of funds through three shell organisations with transfers routed via Hyderabad and Delhi offices.','HIGHLY_CONFIDENTIAL','UNDER_INVESTIGATION','Hyderabad Office',78,'2026-03-10'),
('CASE-2026-002','Tampered procurement records at regional depot','Procurement files show inconsistent revision histories; forensic imaging requested.','CONFIDENTIAL','OPEN','Delhi Office',54,'2026-04-02'),
('CASE-2026-003','Insider data exfiltration attempt','Unusual bulk downloads by an internal account outside working hours.','RESTRICTED_EVIDENCE','LEGAL_REVIEW','Head Office',91,'2026-02-18');

INSERT INTO public.evidence (case_id, evidence_number, title, description, classification, sha256, version, tags, uploaded_office, frozen)
SELECT c.id, v.num, v.title, v.descr, v.cls::public.classification, v.hash, v.ver, v.tags, v.office, v.frozen
FROM public.cases c
JOIN (VALUES
  ('CASE-2026-001','EVID-01','Bank statement bundle — March','Consolidated statements for three accounts held by Organisation X.','HIGHLY_CONFIDENTIAL','a84f0c1de9b7325ac4419f0b3d81e7f2c6a5d0938e17b442ca6d5f1e9034 93d2','v1.0',ARRAY['FINANCIAL','IMPORTANT'],'Hyderabad Office',true),
  ('CASE-2026-001','EVID-02','Witness statement — Person A','Signed statement recorded on 12 March placing Person A at the Hyderabad premises.','CONFIDENTIAL','5c1b77e0a9f4d2338bb61e0cf7a2d94e18c3705ba6ef9d2c4471a8e50fbb 21a7','v1.1',ARRAY['WITNESS','REQUIRES REVIEW'],'Hyderabad Office',false),
  ('CASE-2026-001','EVID-03','Forensic imaging report','Disk image analysis of the seized workstation.','RESTRICTED_EVIDENCE','9e0d4a5f18c37b62ad0f4419e7c25b83d61fa07c94e28b5013cd6ff7a24b 8c30','v1.0',ARRAY['FORENSIC'],'Head Office',false),
  ('CASE-2026-002','EVID-01','Procurement ledger extract','Extract of purchase orders raised between January and March.','CONFIDENTIAL','2f7ac91e60b8d4530a1c7e29fb4d6083c95ea17b3d0248fc6b91e73a50cd 4471','v1.0',ARRAY['FINANCIAL'],'Delhi Office',false),
  ('CASE-2026-003','EVID-01','Access log export','Server access logs covering the suspected exfiltration window.','RESTRICTED_EVIDENCE','7b3e05c9a41f28d6035ba7e19c4d0f27e83a615bc0d972f4a18e63d5027c 9f18','v1.0',ARRAY['COMMUNICATION','IMPORTANT'],'Head Office',true)
) AS v(case_number,num,title,descr,cls,hash,ver,tags,office,frozen) ON v.case_number = c.case_number;

INSERT INTO public.case_timeline (case_id, occurred_on, title, detail)
SELECT c.id, t.on_date::date, t.title, t.detail FROM public.cases c
JOIN (VALUES
  ('CASE-2026-001','2026-03-10','Incident reported','Suspicious transfer pattern flagged by the reporting bank.'),
  ('CASE-2026-001','2026-03-11','Complaint registered','Formal complaint recorded at Hyderabad Office.'),
  ('CASE-2026-001','2026-03-12','Evidence uploaded','Bank statement bundle and witness statement lodged in the vault.'),
  ('CASE-2026-001','2026-03-14','Forensic analysis','Workstation imaged and hashed by the forensic unit.'),
  ('CASE-2026-001','2026-03-16','Legal review','Preliminary legal assessment requested.'),
  ('CASE-2026-002','2026-04-02','Case opened','Depot audit escalated to investigation.'),
  ('CASE-2026-003','2026-02-18','Alert raised','Automated monitoring flagged bulk downloads outside working hours.')
) AS t(case_number,on_date,title,detail) ON t.case_number = c.case_number;

INSERT INTO public.custody_events (case_id, evidence_id, actor_name, action, office, reason, outcome, hash_at_event, occurred_at)
SELECT e.case_id, e.id, 'Forensic Unit', a.action, e.uploaded_office, a.reason, 'SUCCESS', e.sha256, now() - (a.ago || ' hours')::interval
FROM public.evidence e
JOIN (VALUES ('CREATED','Initial lodgement of evidence','96'),('VERIFIED','Fingerprint recomputed and matched','72'),('VIEWED','Reviewed by case officer','24'))
  AS a(action,reason,ago) ON true;
