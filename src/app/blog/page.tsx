import Link from "next/link";

// Dummy blog posts data
const posts = [
  {
    slug: "first-post",
    title: "First Blog Post",
    summary: "This is the summary of the first post.",
  },
  {
    slug: "second-post",
    title: "Second Blog Post",
    summary: "This is the summary of the second post.",
  },
];

export default function BlogPage() {
  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug} className="border-b pb-4">
            <Link
              href={`/blog/${post.slug}`}
              className="text-xl font-semibold hover:underline"
            >
              {post.title}
            </Link>
            <p className="text-gray-600 mt-2">{post.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
