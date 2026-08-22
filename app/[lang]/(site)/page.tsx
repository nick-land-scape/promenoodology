import Hero from "@/components/Hero";
import { getHeroVideos } from "@/lib/source";

/* The films are looked up here and the page is still built once and cached; it
   is the browser that picks which of them plays. */
export const revalidate = 60;

export default async function Home() {
  const films = await getHeroVideos();
  return <Hero films={films} />;
}
