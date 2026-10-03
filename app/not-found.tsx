import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container py-24">
      <h1 className="page-title">Page not found.</h1>
      <p className="my-5">
        This page may have moved or is no longer available.
      </p>
      <Link className="underline" href="/">
        Back to the store
      </Link>
    </main>
  );
}
