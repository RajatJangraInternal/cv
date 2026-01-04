import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import React from "react";

interface PostData {
  title: string;
  summary: string;
  content: string;
}

function getPost(slug: string): PostData | null {
  const postPath = path.join(
    process.cwd(),
    "src/app/blog/posts",
    `${slug}.json`
  );
  if (!fs.existsSync(postPath)) return null;
  const file = fs.readFileSync(postPath, "utf-8");
  return JSON.parse(file);
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return notFound();
  return (
    <main className="max-w-2xl mx-auto py-8 px-4 font-mono">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <article
        className="prose font-mono"
        dangerouslySetInnerHTML={{
          __html: post.content.replace(/\n/g, "<br/>"),
        }}
      />
    </main>
  );
}

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), "src/app/blog/posts");
  const files = fs.readdirSync(postsDir);
  return files.map((file) => ({ slug: file.replace(/\.json$/, "") }));
}
