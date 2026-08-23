import { CouponForm } from "@/components/dashboard/coupon-form";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export const metadata = {
  title: "New Coupon | Dashboard",
};

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Create New Coupon</h2>
        <BreadCrumbs path="coupons" page="Add" />
      </div>
      <CouponForm />
    </div>
  );
}
