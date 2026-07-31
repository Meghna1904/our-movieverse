export const MOVIE_QUOTES: Array<{ quote: string; movie: string }> = [
  { quote: "Here's looking at you, kid.", movie: "Casablanca" },
  { quote: "May the Force be with you.", movie: "Star Wars" },
  { quote: "I'll be back.", movie: "The Terminator" },
  { quote: "You're gonna need a bigger boat.", movie: "Jaws" },
  { quote: "Life is like a box of chocolates.", movie: "Forrest Gump" },
  { quote: "To infinity and beyond!", movie: "Toy Story" },
  { quote: "Why so serious?", movie: "The Dark Knight" },
  { quote: "I see dead people.", movie: "The Sixth Sense" },
  { quote: "Just keep swimming.", movie: "Finding Nemo" },
  { quote: "Hasta la vista, baby.", movie: "Terminator 2" },
  { quote: "You had me at hello.", movie: "Jerry Maguire" },
  { quote: "Wax on, wax off.", movie: "The Karate Kid" },
  { quote: "There's no place like home.", movie: "The Wizard of Oz" },
  { quote: "I am your father.", movie: "The Empire Strikes Back" },
  { quote: "Bond. James Bond.", movie: "Dr. No" },
  { quote: "Nobody puts Baby in a corner.", movie: "Dirty Dancing" },
  { quote: "As you wish.", movie: "The Princess Bride" },
  { quote: "Roads? Where we're going, we don't need roads.", movie: "Back to the Future" },
  { quote: "I feel the need — the need for speed!", movie: "Top Gun" },
  { quote: "Say hello to my little friend.", movie: "Scarface" },
];

export function quoteOfTheDay(seed = new Date().toDateString()) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % MOVIE_QUOTES.length;
  return MOVIE_QUOTES[idx];
}
