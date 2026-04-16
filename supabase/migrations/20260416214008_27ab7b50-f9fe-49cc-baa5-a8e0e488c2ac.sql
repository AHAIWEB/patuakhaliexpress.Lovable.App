CREATE POLICY "Users delete own photocards"
ON public.photocards
FOR DELETE
USING (auth.uid() = created_by);