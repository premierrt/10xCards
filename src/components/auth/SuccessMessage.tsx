import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessMessageProps {
  title: string;
  message: string;
  actionText?: string;
  actionHref?: string;
}

export function SuccessMessage({ title, message, actionText, actionHref }: SuccessMessageProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {actionText && actionHref && (
            <div className="pt-4">
              <a
                href={actionHref}
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                {actionText}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
