import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TheBull" },
      { name: "description", content: "The terms that apply when you use TheBull's curated directory." },
      { property: "og:title", content: "Terms of Service — TheBull" },
      { property: "og:description", content: "The terms that apply when you use TheBull." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 2026">
      <p>By using TheBull you agree to these terms. If you do not agree, please do not use the website.</p>
      <h2>Use of the directory</h2>
      <p>
        TheBull lists links to videos, websites and applications owned by third parties. We curate these links in good
        faith but do not own, operate or guarantee the content, availability or safety of external resources.
      </p>
      <h2>Intellectual property</h2>
      <p>
        Names, logos and images of listed resources belong to their respective owners. The TheBull name and logo belong
        to TheBull.
      </p>
      <h2>No warranty</h2>
      <p>
        The website is provided “as is”. We are not liable for any loss or damage arising from your use of TheBull or
        any linked resource.
      </p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. Continued use of the website means you accept the updated terms.</p>
    </LegalPage>
  );
}
