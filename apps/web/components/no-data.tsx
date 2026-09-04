import { FolderOpen } from "lucide-react";

type Props = {
  title?: string;
};

const NoData = ({ title }: Props) => {
  const formattedTitle = title
    ? title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()
    : "Data";

  return (
    <div className="flex min-h-75 md:min-h-100 w-full flex-col items-center justify-center text-center p-8 border border-gray-200 bg-white max-w-md mx-auto my-6">
      <div className="flex items-center justify-center mb-5">
        <div className="w-16 h-16 bg-gray-50 flex items-center justify-center border border-gray-200">
          <FolderOpen className="text-gray-300 w-8 h-8" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-base font-bold text-gray-900">
          No {formattedTitle} Found
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          There&apos;s nothing to show here right now. Once {title || "data"} is
          added, it will appear here automatically.
        </p>
      </div>
    </div>
  );
};

export default NoData;
