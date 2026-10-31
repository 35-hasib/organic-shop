import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { PageHeader } from "../components/PageHeader";

type InfoKind = "about" | "faq" | "returns" | "privacy" | "terms";

const titles: Record<InfoKind, [string, string]> = {
  about: ["About Organic Shop", "অর্গানিক শপ সম্পর্কে"],
  faq: ["Frequently asked questions", "সাধারণ জিজ্ঞাসা"],
  returns: ["Returns & refunds", "ফেরত ও রিফান্ড"],
  privacy: ["Privacy policy", "গোপনীয়তা নীতি"],
  terms: ["Terms of service", "সেবার শর্তাবলী"],
};

export function InfoPage({ kind }: { kind: InfoKind }) {
  const { lang } = useLanguage();
  const settings = useSettings();
  const title = titles[kind][lang === "bn" ? 1 : 0];
  const settingKey = kind === "returns" ? "returnPolicy" : kind === "about" ? "aboutUs" : kind;
  const text = (lang === "bn" ? settings[`${settingKey}Bn`] : settings[settingKey]) || "";
  let faqs: { q: string; a: string }[] = [];
  if (kind === "faq") {
    try {
      faqs = JSON.parse((lang === "bn" ? settings.faqBn : settings.faq) || "[]");
    } catch {
      faqs = [];
    }
  }

  return (
    <div>
      <PageHeader title={title} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {kind === "about" && (
          <div className="mb-10 overflow-hidden rounded-3xl">
            <img src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1400&q=80" alt="" className="h-72 w-full object-cover" />
          </div>
        )}
        {kind === "about" && !text && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Gur", "খাঁটি গুড়", "Traditional jaggery made with care, from date palm and sugarcane sources."],
              ["Doi", "দই", "Fresh, creamy doi prepared for everyday family meals."],
              ["Dudh", "দুধ", "Pure milk sourced with attention to freshness and hygiene."],
              ["Ghee", "ঘি", "Slow-churned deshi ghee with rich aroma and traditional taste."],
            ].map(([title, bn, desc]) => (
              <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="font-display text-xl text-stone-900">{lang === "bn" ? bn : title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{desc}</p>
              </div>
            ))}
          </div>
        )}
        {kind === "faq" ? (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-stone-200 bg-white p-5">
                <summary className="cursor-pointer list-none font-semibold text-stone-800 marker:hidden">{faq.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{faq.a}</p>
              </details>
            ))}
            {faqs.length === 0 && <p className="text-stone-500">{lang === "bn" ? "কোনো প্রশ্ন পাওয়া যায়নি।" : "No questions available."}</p>}
          </div>
        ) : (
          <div className="prose prose-stone max-w-none">
            {text.split("\n").filter(Boolean).map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed text-stone-600">{paragraph}</p>
            ))}
          </div>
        )}
        <div className="mt-10 rounded-2xl bg-cream-100 p-6">
          <p className="text-sm text-stone-600">
            {lang === "bn" ? "আরও জানতে চান?" : "Still have a question?"}{" "}
            <Link to="/contact" className="font-semibold text-leaf-700 hover:text-leaf-900">{lang === "bn" ? "আমাদের সাথে যোগাযোগ করুন" : "Talk to our team"}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
