import { prisma } from "../prisma.js";
import { HttpError } from "../lib/http.js";
import { money, parseMoney } from "../lib/money.js";

export async function validateCoupon(tx, { code, userId, subtotal }) {
  if (!code) return null;
  const coupon = await tx.coupon.findUnique({ where: { code: String(code).trim().toUpperCase() } });
  if (!coupon || !coupon.active) throw new HttpError(400, "Coupon is not valid");
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new HttpError(400, "Coupon is not active yet");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new HttpError(400, "Coupon has expired");
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new HttpError(400, "Coupon usage limit reached");
  }
  if (parseMoney(subtotal).lt(parseMoney(coupon.minOrderAmount))) {
    throw new HttpError(400, `Minimum order for this coupon is ৳${money(coupon.minOrderAmount)}`);
  }
  if (userId) {
    const customerUses = await tx.order.count({
      where: { userId, couponId: coupon.id, status: { not: "CANCELLED" } },
    });
    if (customerUses >= coupon.perCustomerLimit) {
      throw new HttpError(400, "You have already used this coupon");
    }
  }

  let discount = parseMoney(0);
  if (coupon.type === "PERCENTAGE") {
    discount = parseMoney(subtotal).mul(parseMoney(coupon.value)).div(100);
    if (coupon.maxDiscount) discount = discount.gt(parseMoney(coupon.maxDiscount)) ? parseMoney(coupon.maxDiscount) : discount;
  } else {
    discount = parseMoney(coupon.value);
  }
  if (discount.gt(subtotal)) discount = parseMoney(subtotal);

  return { coupon, discount: parseMoney(discount.toFixed(2)) };
}

export async function consumeCoupon(tx, couponId) {
  const updated = await tx.$executeRawUnsafe(
    `UPDATE coupons SET used_count = used_count + 1
     WHERE id = $1::uuid AND (usage_limit IS NULL OR used_count < usage_limit)`,
    couponId
  );
  if (updated !== 1) throw new HttpError(400, "Coupon usage limit reached");
}

export async function releaseCoupon(tx, couponId) {
  if (!couponId) return;
  await tx.$executeRawUnsafe(
    `UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE id = $1::uuid`,
    couponId
  );
}
