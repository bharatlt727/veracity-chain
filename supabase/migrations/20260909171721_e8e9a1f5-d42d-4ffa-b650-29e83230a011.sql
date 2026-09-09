
CREATE OR REPLACE FUNCTION public.classification_level(c public.classification)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE c
    WHEN 'PUBLIC' THEN 1
    WHEN 'INTERNAL' THEN 2
    WHEN 'CONFIDENTIAL' THEN 3
    WHEN 'HIGHLY_CONFIDENTIAL' THEN 4
    WHEN 'RESTRICTED_EVIDENCE' THEN 5
  END
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_clearance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_clearance() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_frozen_evidence() FROM PUBLIC, anon, authenticated;
