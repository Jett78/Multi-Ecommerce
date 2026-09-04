import { Testimonial } from "@/types/testimonial";
import Image from "next/image";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "from-gray-600 to-gray-800",
  "from-gray-500 to-gray-700",
  "from-gray-400 to-gray-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index]!;
}

const TestimonialCard = ({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group relative border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-gray-900",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="text-gray-200 group-hover:text-gray-300 absolute top-5 right-5 h-8 w-8 transition-colors"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M6 6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a3 3 0 0 1-3 3H5a1 1 0 1 0 0 2h1a5 5 0 0 0 5-5V8a2 2 0 0 0-2-2zm9 0a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a3 3 0 0 1-3 3h-1a1 1 0 1 0 0 2h1a5 5 0 0 0 5-5V8a2 2 0 0 0-2-2z"
          clipRule="evenodd"
        />
      </svg>

      <div className="flex items-center gap-3">
        <div className="relative">
          {testimonial.avatar ? (
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                getAvatarColor(testimonial.name)
              )}
            >
              {getInitials(testimonial.name)}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">
            {testimonial.name}
          </p>
          {testimonial.designation && (
            <p className="text-xs text-gray-400">
              {testimonial.designation}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-600">
        &ldquo;{testimonial.message}&rdquo;
      </p>
    </div>
  );
};

export default TestimonialCard;
