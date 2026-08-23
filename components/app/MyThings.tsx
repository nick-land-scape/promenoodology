"use client";

import Link from "next/link";
import Photo from "../Photo";
import type { MyPhoto, MyPost } from "@/lib/app/me";
import { useSay } from "./Words";

/**
 * The three things that are yours, in preview.
 *
 * A preview and a way through to all of it, rather than everything at once: an
 * account screen with sixty photographs on it is not an account screen. Each of
 * these says how many there are, shows the first few, and has its own page.
 *
 * Where you have none of something it says so in one line rather than hiding —
 * "no photographs yet" is a fact about you and a hint about what this is for.
 */

export function PhotoPreview({
  photos,
  most = 6,
}: {
  photos: MyPhoto[];
  most?: number;
}) {
  const say = useSay();
  return (
    <section className="app-section">
      <div className="app-section-head">
        <h2 className="app-h2">{say("mine.photographs")}</h2>
        {photos.length > most ? (
          <Link className="app-more" href="/app/account/photographs">
            {say("home.allOfThem").replace("{n}", String(photos.length))}
          </Link>
        ) : (
          <span className="app-label">{photos.length}</span>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="app-note">
          {say("mine.noPhotographs")}
        </p>
      ) : (
        <ul className="mine-grid">
          {photos.slice(0, most).map((photo) => (
            <li key={photo.id}>
              <Photo
                src={photo.src}
                alt=""
                width={photo.width}
                height={photo.height}
                sizes="33vw"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PostPreview({
  posts,
  most = 2,
}: {
  posts: MyPost[];
  most?: number;
}) {
  const say = useSay();
  return (
    <section className="app-section">
      <div className="app-section-head">
        <h2 className="app-h2">{say("mine.whatYouSaid")}</h2>
        {posts.length > most ? (
          <Link className="app-more" href="/app/account/posts">
            {say("home.allOfThem").replace("{n}", String(posts.length))}
          </Link>
        ) : (
          <span className="app-label">{posts.length}</span>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="app-note">
          {say("mine.nothingYet")}{" "}
          <Link href="/app/connect">{say("mine.saySomething")}</Link>.
        </p>
      ) : (
        <ul className="row-list">
          {posts.slice(0, most).map((post) => (
            <li key={post.id}>
              <div className="row">
                {post.photos[0] ? (
                  <span className="row-thumb">
                    <Photo src={post.photos[0]} alt="" fill sizes="58px" />
                  </span>
                ) : null}
                <span className="row-body">
                  <span className="row-title">
                    {post.text || "a picture, no words"}
                  </span>
                  <span className="row-meta">
                    {[
                      post.place,
                      post.when,
                      post.replies > 0 ? `${post.replies} replies` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
