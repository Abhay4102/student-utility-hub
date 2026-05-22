import { InfoPageLayout } from "@/components/InfoPageLayout";

export default function Privacy() {
  return (
    <InfoPageLayout
      title="Privacy Policy"
      subtitle="What we collect, what we don't, and how your data is used."
      updated="May 22, 2026"
    >
      <section>
        <p>
          TREO TOOL&apos;S (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your
          privacy. This policy explains what information is collected when you use our website
          and tools, and how that information is handled.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Files you process</h2>
        <p>
          The vast majority of our tools — image converters, PDF tools, the background remover,
          the photo resizer, the Word document maker, calculators, and converters — run{" "}
          <strong>100% in your browser</strong>. Your files are never uploaded to our servers
          for these tools. They stay on your device.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. AI features</h2>
        <p>
          The Study Assistant and Notes Maker send your typed question (and any image you
          choose to attach) to a third-party AI provider so a response can be generated. We do
          not sell this data and we do not use it for any purpose other than producing your
          answer. Please do not include personal, sensitive, or confidential information in
          AI prompts.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Local browser storage</h2>
        <p>
          We store the following on your device using <em>localStorage</em> and{" "}
          <em>sessionStorage</em> — nothing of this leaves your browser:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your past Study Assistant chats and preferences</li>
          <li>Your selected subject and answer-style mode</li>
          <li>A flag remembering that you&apos;ve seen the welcome popup</li>
        </ul>
        <p>You can clear this any time by clearing your browser&apos;s site data.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. Cookies and analytics</h2>
        <p>
          We do not use first-party tracking cookies. If we add basic analytics in the future
          to understand which tools are used most, we will use a privacy-friendly,
          aggregate-only provider and update this policy.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. Advertising</h2>
        <p>
          This site may display ads served by third-party providers such as Google AdSense.
          These providers may use cookies and similar technologies to serve ads based on your
          previous visits to this and other websites. You can opt out of personalised
          advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google Ads Settings
          </a>{" "}
          or{" "}
          <a
            href="https://www.aboutads.info"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            aboutads.info
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Children&apos;s privacy</h2>
        <p>
          TREO TOOL&apos;S is a study toolkit and is intended for general audiences including
          students. We do not knowingly collect personal information from children. If you
          believe a child has provided personal information, please contact us so we can
          remove it.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Third-party links</h2>
        <p>
          Our site may link to third-party websites. We are not responsible for the privacy
          practices of those sites and encourage you to review their policies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy occasionally. The &quot;Last updated&quot; date at
          the top of this page reflects the most recent revision.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
        <p>
          Questions about this policy? Reach us via our{" "}
          <a href="/contact" className="text-primary hover:underline">Contact page</a>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
