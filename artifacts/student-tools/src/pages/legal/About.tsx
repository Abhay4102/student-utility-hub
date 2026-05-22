import { InfoPageLayout } from "@/components/InfoPageLayout";

export default function About() {
  return (
    <InfoPageLayout
      title="About TREO TOOL'S"
      subtitle="An all-in-one student toolkit that runs entirely in your browser."
    >
      <section>
        <h2 className="text-lg font-semibold text-foreground">Our mission</h2>
        <p>
          TREO TOOL&apos;S exists to give students a fast, free, and private place to do the
          everyday tasks that come up in school and college — converting an image, building a
          PDF, locking a document, taking notes, asking a study question, or running a quick
          calculation. We believe these little jobs shouldn&apos;t require signing up, paying
          for a subscription, or uploading personal work to a stranger&apos;s server.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">What you can do here</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Convert images between JPG, PNG, and PDF.</li>
          <li>Create, edit, merge, split, compress, lock, and unlock PDFs.</li>
          <li>Resize photos and remove image backgrounds.</li>
          <li>Build Word (.docx) documents.</li>
          <li>Use a scientific calculator, GPA calculator, unit converter, and more.</li>
          <li>Ask our AI study assistant questions and turn notes into study material.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">How it works</h2>
        <p>
          Almost every tool on TREO TOOL&apos;S runs <strong>100% in your browser</strong>.
          Your files never leave your device for the conversion, compression, or editing tools.
          The AI study features are the only exception — they send your question text (and any
          image you choose to attach) to our AI provider so a response can be generated.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">Who we are</h2>
        <p>
          TREO TOOL&apos;S is an independent project built and maintained by a small team that
          loves clean, useful web tools. We&apos;re not affiliated with Microsoft, Adobe, Google,
          or any other brand mentioned on this site.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          Have a suggestion, found a bug, or want to say hi? Visit our{" "}
          <a href="/contact" className="text-primary hover:underline">Contact page</a>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
