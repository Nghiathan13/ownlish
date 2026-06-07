import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">EngVocab Web</p>
        <h1>Build and review your English vocabulary.</h1>
        <p className="muted">
          This web app is connected to the new EngVocab backend.
        </p>
        <div className="actions">
          <Link href="/login">Login</Link>
          <Link href="/vocabulary">Vocabulary</Link>
        </div>
      </section>
    </main>
  );
}
