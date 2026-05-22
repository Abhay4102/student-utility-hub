import { InfoPageLayout } from "@/components/InfoPageLayout";

export default function Terms() {
  return (
    <InfoPageLayout
      title="Terms of Service"
      subtitle="The basic rules for using TREO TOOL'S."
      updated="May 22, 2026"
    >
      <section>
        <p>
          By accessing or using TREO TOOL&apos;S (&quot;the Service&quot;), you agree to these
          Terms of Service. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">1. Use of the Service</h2>
        <p>
          The Service is provided free of charge for personal and educational use. You agree to
          use it only for lawful purposes and not in any way that could damage, disable, or
          overburden the Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">2. Your content and files</h2>
        <p>
          You are solely responsible for the files you process and the prompts you submit.
          You retain all rights to your content. Because most tools run entirely in your
          browser, we do not receive copies of your files. For AI features, see our{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">3. Acceptable use</h2>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Violate any law or third-party rights, including copyright and privacy rights.</li>
          <li>Distribute malware or attempt to compromise the security of the Service.</li>
          <li>Scrape, reverse engineer, or attempt to extract source code beyond what is publicly served to your browser.</li>
          <li>Generate or share content that is illegal, harmful, harassing, or hateful.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">4. AI output disclaimer</h2>
        <p>
          The Study Assistant and Notes Maker generate answers using AI. Output may be
          inaccurate, incomplete, or out of date. Always verify important information against
          authoritative sources. The Service is provided for study support and is not a
          substitute for professional advice in medicine, law, finance, or any other field.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">5. No warranty</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;, without
          warranty of any kind, express or implied. We do not warrant that the Service will
          be uninterrupted, error-free, or that any file conversion will be perfect.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">6. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, TREO TOOL&apos;S and its operators will not
          be liable for any indirect, incidental, special, or consequential damages, including
          loss of data, arising from your use of the Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">7. Third-party services</h2>
        <p>
          The Service may rely on third-party providers (for example, AI APIs and advertising
          partners). Their respective terms and privacy policies apply to the parts they
          provide.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">8. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service after
          changes are posted constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
        <p>
          For questions about these Terms, please visit our{" "}
          <a href="/contact" className="text-primary hover:underline">Contact page</a>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
