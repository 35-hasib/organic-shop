-- Allow guest checkout orders without a customer account.
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
