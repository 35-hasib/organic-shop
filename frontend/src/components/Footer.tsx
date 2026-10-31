import { Link } from "react-router-dom";
import { Facebook, Instagram, Leaf, Mail, MapPin, Phone, Send } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export function Footer() {
  const { t, lang } = useLanguage();
  const settings = useSettings();
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const storeName = lang === "bn" && settings.storeNameBn ? settings.storeNameBn : settings.storeName || "Organic Shop";
  const address = lang === "bn" && settings.storeAddressBn ? settings.storeAddressBn : settings.storeAddress;

  return (
    <footer className="mt-20 bg-leaf-950 text-cream-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-leaf-800">
                <Leaf className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl">{storeName}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-200/80">
              {lang === "bn"
                ? "বিশ্বস্ত খামার থেকে যত্নে বাছাই করা জৈব খাবার।"
                : "Carefully chosen organic food from farms we know and trust."}
            </p>
            <div className="mt-5 flex gap-3">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20" aria-label="WhatsApp">
                  <Send className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cream-300">{t("footer.shop")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-cream-200/80">
              <li><Link to="/shop" className="hover:text-white">{t("shop.all")}</Link></li>
              <li><Link to="/shop?featured=1" className="hover:text-white">{t("home.featured")}</Link></li>
              <li><Link to="/shop?sort=best_selling" className="hover:text-white">{t("shop.bestSelling")}</Link></li>
              <li><Link to="/wishlist" className="hover:text-white">{t("nav.wishlist")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cream-300">{t("footer.help")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-cream-200/80">
              <li><Link to="/faq" className="hover:text-white">{t("footer.faq")}</Link></li>
              <li><Link to="/returns" className="hover:text-white">{t("footer.returns")}</Link></li>
              <li><Link to="/terms" className="hover:text-white">{t("footer.terms")}</Link></li>
              <li><Link to="/privacy" className="hover:text-white">{t("footer.privacy")}</Link></li>
              <li><Link to="/account/orders" className="hover:text-white">{t("account.orders")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cream-300">{t("footer.newsletter")}</h3>
            <p className="mt-4 text-sm text-cream-200/80">{t("footer.newsletterText")}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!email) return;
                setEmail("");
                show(lang === "bn" ? "সাবস্ক্রিপশন নিশ্চিত হয়েছে।" : "You are subscribed. Thank you.");
              }}
              className="mt-4 flex overflow-hidden rounded-full bg-white/10 p-1"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("common.email")}
                className="w-full bg-transparent px-4 text-sm text-white placeholder:text-cream-200/50 focus:outline-none"
              />
              <button className="rounded-full bg-cream-100 px-4 py-2 text-sm font-semibold text-leaf-900 hover:bg-white" aria-label={t("footer.subscribe")}>
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-5 space-y-2 text-xs text-cream-200/70">
              {settings.storePhone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {settings.storePhone}</p>}
              {settings.storeEmail && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {settings.storeEmail}</p>}
              {address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {address}</p>}
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-cream-200/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {storeName}. {t("footer.rights")}</p>
          <p>Made with care in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
