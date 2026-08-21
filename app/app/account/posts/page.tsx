import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import Photo from "@/components/Photo";
import { myPosts, requireMember } from "@/lib/app/me";

export const metadata = { title: "What you have said" };
export const dynamic = "force-dynamic";

export default async function MyPostsPage() {
  await requireMember("/app/account/posts");
  const posts = await myPosts();

  return (
    <>
      <AppHeader eyebrow="what you have said" title="everything you wrote" back="/app/account" />

      {posts.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          Nothing yet. <Link href="/app/connect">Say something</Link>.
        </p>
      ) : (
        <ul className="feed">
          {posts.map((post) => (
            <li key={post.id} className="post">
              <div className="post-head">
                <span className="row-body">
                  <span className="row-meta">
                    {[post.place, post.when].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </div>
              {post.text ? <p className="post-text">{post.text}</p> : null}
              {post.photos.length > 0 ? (
                <ul className="post-strip">
                  {post.photos.map((src) => (
                    <li key={src}>
                      <Photo src={src} alt="" width={900} height={900} sizes="72vw" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {post.replies > 0 ? (
                <div className="post-actions">
                  <Link className="post-action" href="/app/connect">
                    {post.replies} {post.replies === 1 ? "reply" : "replies"} ›
                  </Link>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
