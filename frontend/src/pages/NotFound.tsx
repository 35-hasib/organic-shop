import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100">
        <Sprout className="h-8 w-8 text-leaf-600" />
      </span>
      <p className="mt-6 font-display text-6xl text-leaf-900">404</p>
      <h1 className="mt-2 font-display text-3xl text-stone-800">{t("error.notFound")}</h1>
      <p className="mt-2 text-stone-500">{t("error.notFoundText")}</p>
      <Link to="/" className="btn-primary mt-6">{t("error.backHome")}</Link>
    </div>
  );
}
