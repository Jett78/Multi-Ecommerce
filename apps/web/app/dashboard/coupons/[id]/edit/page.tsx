import { getCouponById } from "@/actions/discount-action";
import { CouponForm } from "@/components/dashboard/coupon-form";
import NoData from "@/components/no-data";
import BreadCrumbs from "@/components/ui/bread-crumbs";

export const metadata = {
  title: "Edit Coupon | Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: PageProps) {
  const { id } = await params;
  const coupon = await getCouponById(id);

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Edit Coupon</h2>
        <BreadCrumbs path="coupons" page="Edit" />
      </div>
      {coupon ? <CouponForm coupon={coupon} /> : <NoData title="Coupon" />}
    </div>
  );
}
