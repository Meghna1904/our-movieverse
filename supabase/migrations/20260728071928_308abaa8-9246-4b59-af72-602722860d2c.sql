CREATE TABLE public.movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  genre TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  backdrop_url TEXT,
  overview TEXT,
  runtime INTEGER,
  status TEXT NOT NULL DEFAULT 'watchlist' CHECK (status IN ('watchlist','watched')),
  added_by TEXT NOT NULL CHECK (added_by IN ('whiskeyy','matildaa')),
  priority TEXT CHECK (priority IN ('low','medium','high')),
  streaming_platform TEXT,
  expected_mood TEXT,
  watched_date DATE,
  my_rating NUMERIC(3,1),
  his_rating NUMERIC(3,1),
  favorite_scene TEXT,
  funny_memory TEXT,
  recommended_by TEXT,
  notes TEXT,
  mood_afterwards TEXT,
  favorite_quote TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.movies TO service_role;

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- No policies: all access goes through the passcode-gated server functions using the service role.

CREATE INDEX movies_status_idx ON public.movies (status);
CREATE INDEX movies_watched_date_idx ON public.movies (watched_date DESC);
CREATE INDEX movies_created_at_idx ON public.movies (created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_movies_updated_at
BEFORE UPDATE ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();