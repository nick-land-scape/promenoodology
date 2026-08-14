import type { Metadata } from "next";
import QuoteList from "@/components/QuoteList";
import ResourceKinds from "@/components/ResourceKinds";
import { getQuotes } from "@/lib/data";
import { getStories } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Quotes",
  description: "Things people said while they were with us.",
  alternates: { canonical: "/resources/quotes" },
};

export default function QuotesPage() {
  const quotes = getQuotes();
  const said = new Set(quotes.map((quote) => quote.story));
  const stories = getStories()
    .filter((story) => said.has(story.tag))
    .map((story) => ({ tag: story.tag, title: story.title }));

  return (
    <main className="page">
      <h1 className="visually-hidden">Quotes</h1>
      <QuoteList
        quotes={quotes}
        stories={stories}
        kinds={<ResourceKinds current="/resources/quotes" />}
      />
    </main>
  );
}
