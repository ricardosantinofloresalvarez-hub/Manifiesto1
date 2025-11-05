import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings } from 'lucide-react';

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  onAction?: () => void;
  actionIcon?: 'plus' | 'settings';
  actionLabel?: string;
}

export default function TopAppBar({ title, onBack, onAction, actionIcon = 'plus', actionLabel }: TopAppBarProps) {
  const ActionIcon = actionIcon === 'plus' ? Plus : Settings;

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {onAction && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onAction}
            data-testid="button-action"
          >
            <ActionIcon className="h-5 w-5" />
            {actionLabel && <span className="sr-only">{actionLabel}</span>}
          </Button>
        )}
      </div>
    </header>
  );
}
