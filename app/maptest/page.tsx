import Everywhere from "@/components/app/Everywhere";
import "../app/app.css";

/**
 * The map, on its own, with no login in front of it.
 *
 * Temporary. The map draws in the simulator's own Safari and not inside the app,
 * and a screen behind a members-only login is a screen that cannot be opened
 * with a plain fetch, in a fresh browser, or by anybody who is helping — so
 * while that is being chased there is one address that shows the map and nothing
 * else. It carries three fixed pins and reads nothing from the database.
 *
 * Delete this file once the map draws in the app.
 */
export const metadata = { title: "map, on its own", robots: { index: false } };

const pins = [
  {
    id: "one",
    title: "dinner for 500",
    where: "Sheffield, England",
    when: "August 2023",
    lat: 53.3811,
    lng: -1.4701,
    slug: null,
    ahead: false,
    fed: 500,
  },
  {
    id: "two",
    title: "DONGOlogy",
    where: "Dongo, Italy",
    when: "April 2025",
    lat: 46.1281,
    lng: 9.2755,
    slug: null,
    ahead: false,
    fed: 120,
  },
  {
    id: "three",
    title: "long table no. 12",
    where: "Zürich Kreis 4",
    when: "22 August",
    lat: 47.3769,
    lng: 8.5217,
    slug: null,
    ahead: true,
    fed: null,
  },
];

export default function MapOnItsOwn() {
  return (
    <div className="app-shell">
      <div className="app-column">
        <header className="app-header">
          <p className="app-eyebrow">test</p>
          <h1>the map, on its own</h1>
        </header>
        <div className="reading-stage">
          <Everywhere pins={pins} loud />
        </div>
      </div>
    </div>
  );
}
