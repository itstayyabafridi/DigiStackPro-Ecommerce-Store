"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container py-24">
      <h1 className="page-title">Something went wrong.</h1>
      <p className="my-6">
        We couldn’t load this page. Try again, or contact the store if it
        continues.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
