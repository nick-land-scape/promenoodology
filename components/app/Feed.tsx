"use client";

import Photo from "../Photo";
import { useState } from "react";
import type { Member, Post } from "@/lib/content";

type Props = {
  posts: Post[];
  people: Member[];
};

/** Connect: what people are saying, and who is around. */
export default function Feed({ posts, people }: Props) {
  const [view, setView] = useState<"feed" | "people">("feed");
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <>
      <div className="segmented" role="tablist" aria-label="Connect">
        {(["feed", "people"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {view === "feed" ? (
        <>
          <div className="compose">
            <span className="avatar" aria-hidden="true">
              you
            </span>
            <input placeholder="say something to everyone…" aria-label="Write a post" />
            <button type="button" className="pill pill-small">
              post
            </button>
          </div>

          <ul className="feed">
            {posts.map((post) => (
              <li key={post.id} className="post">
                <div className="post-head">
                  <span className="avatar" aria-hidden="true">
                    {initials(post.author)}
                  </span>
                  <span className="row-body">
                    <span className="post-who">{post.author}</span>
                    <span className="row-meta">
                      {post.place} · {post.when}
                    </span>
                  </span>
                </div>

                <p className="post-text">{post.text}</p>

                {post.photo ? (
                  <div className="post-photo">
                    <Photo
                      src={post.photo.src}
                      alt=""
                      fill
                      sizes="(max-width: 560px) 100vw, 560px"
                    />
                  </div>
                ) : null}

                <div className="post-actions">
                  <button
                    type="button"
                    className="post-action"
                    aria-pressed={liked[post.id] ? true : false}
                    onClick={() =>
                      setLiked((current) => ({ ...current, [post.id]: !current[post.id] }))
                    }
                  >
                    {post.likes + (liked[post.id] ? 1 : 0)} likes
                  </button>
                  <button type="button" className="post-action">
                    {post.replies} {post.replies === 1 ? "reply" : "replies"}
                  </button>
                  <button type="button" className="post-action">
                    share
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">who is around</h2>
            <span className="app-label">{people.length} people</span>
          </div>
          <ul className="row-list">
            {people.map((member) => {
              return (
                <li key={`${member.first}-${member.last}`}>
                  <div className="row">
                    <span className="avatar" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                    <span className="row-body">
                      <span className="row-title">{member.name}</span>
                      <span className="row-meta">{member.country}</span>
                    </span>
                    <button type="button" className="pill pill-small">
                      say hello
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
