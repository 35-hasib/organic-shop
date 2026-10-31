import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useShop } from "../context/ShopContext";
import { ProductCard } from "../components/ProductCard";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/Loading";

export function Wishlist() {
  const { t } = useLanguage();
  const { wishlistItems } = useShop();

  return (
    <div>
      <PageHeader title={t("wishlist.title")} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {wishlistItems.length === 0 ? (
          <EmptyState
            title={t("wishlist.empty")}
            text={t("wishlist.emptyText")}
            action={<Link to="/shop" className="btn-primary">{t("cart.continue")}</Link>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {wishlistItems.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
