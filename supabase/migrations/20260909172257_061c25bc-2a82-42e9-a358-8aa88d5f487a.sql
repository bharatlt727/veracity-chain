
CREATE POLICY "staff can read evidence files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence');
CREATE POLICY "staff can lodge evidence files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence');
