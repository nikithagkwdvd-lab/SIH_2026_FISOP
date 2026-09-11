import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBannerProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'Unable to complete request',
  message = 'An unexpected error occurred while communicating with the government service platform.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-rose-900">{title}</h4>
          <p className="mt-1 text-sm text-rose-700">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="border-rose-300 text-rose-800 hover:bg-rose-100"
              >
                Retry request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
