import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <a
      href="/dashboard"
      className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
    >
      <ArrowLeft size={20} />
      <span>Powrót do zestawów</span>
    </a>
  );
}
