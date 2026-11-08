import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TheBull" },
      { name: "description", content: "How TheBull handles information when you browse curated videos, sites and apps." },
      { property: "og:title", content: "Privacy Policy — TheBull" },
      { property: "og:description", content: "How TheBull handles information when you browse the platform." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <p>
        TheBull is a curated directory of videos, websites and applications. You can browse the entire platform
        without creating an account.
      </p>
      <h2>Information we collect</h2>
      <p>
        We do not ask visitors for personal information. Like most websites, our hosting provider may log basic
        technical data such as your browser type and IP address to keep the service secure and reliable.
      </p>
      <h2>Links to other websites</h2>
      <p>
        Resources listed on TheBull open on third-party websites and platforms. Those sites have their own privacy
        practices, which we do not control. Please review their policies before sharing information with them.
      </p>
      <h2>Administrator accounts</h2>
      <p>
        Only TheBull administrators sign in. Their email address is stored securely and used solely to manage content.
      </p>
      <h2>Contact</h2>
      <p>If you have questions about this policy, please reach out to the TheBull team.</p>
    </LegalPage>
  );
}
