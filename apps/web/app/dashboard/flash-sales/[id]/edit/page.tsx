import { getFlashSaleById } from "@/actions/flash-sale-action";
import FlashSaleForm from "@/components/dashboard/flash-sale-form";
import NoData from "@/components/no-data";

export const metadata = {
  title: "Edit Flash Sale | Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFlashSalePage({ params }: PageProps) {
  const { id } = await params;
  const sale = await getFlashSaleById(id);

  return (
    <div className="space-y-6">
      {sale ? <FlashSaleForm flashSale={sale} /> : <NoData title="Flash Sale" />}
    </div>
  );
}
