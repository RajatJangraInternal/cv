import Link from "next/link";
import fs from "fs";
import path from "path";

interface PostData {
  title: string;
  summary: string;
  content: string;
}

interface Post extends PostData {
  slug: string;
}

function getPosts(): Post[] {
  const postsDir = path.join(process.cwd(), "src/app/blog/posts");
  const files = fs.readdirSync(postsDir);

  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const slug = file.replace(/\.json$/, "");
      const postPath = path.join(postsDir, file);
      const fileContent = fs.readFileSync(postPath, "utf-8");
      const postData: PostData = JSON.parse(fileContent);

      return {
        slug,
        ...postData,
      };
    });
}

export default function BlogPage() {
  const posts = getPosts();

  return (
    <main className="max-w-2xl mx-auto py-8 px-4 font-mono">
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
