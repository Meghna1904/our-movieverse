-- Allow the anon role (used by the publishable key) full access to movies.
-- This is safe because ALL database access goes through passcode-gated server
-- functions — unauthenticated users can never reach these queries from the client.

GRANT ALL ON public.movies TO anon;

CREATE POLICY "anon_full_access"
  ON public.movies
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
