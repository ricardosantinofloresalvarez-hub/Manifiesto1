import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CategoryBadge from './CategoryBadge';
import { MoreVertical, Pencil, Trash2, Lock, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ManifestItemCardProps {
  id: string;
  name: string;
  category: string;
  quantity: number;
  estimatedValue?: number;
  serialNumber?: string;
  imageUrl?: string;
  luggageBrand?: string | null;
  luggageSize?: string | null;
  isSealed?: boolean | null;
  isLocked?: boolean | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ManifestItemCard({
  name,
  category,
  quantity,
  estimatedValue,
  serialNumber,
  imageUrl,
  luggageBrand,
  luggageSize,
  isSealed,
  isLocked,
  onEdit,
  onDelete,
  }: ManifestItemCardProps) {
    const { t } = useTranslation();
    const getSizeLabel = (size: string) => {
    const sizeMap: Record<string, string> = {
      small: 'Pequeña',
      medium: 'Mediana',
      large: 'Grande',
      xlarge: 'Extra Grande',
    };
    return sizeMap[size] || size;
  };
  return (
    <Card className="p-3 hover-elevate">
      <div className="flex gap-3">
        {imageUrl && (
          <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium truncate">{name}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                  data-testid="button-item-menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} data-testid="button-edit-item">
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('editAction')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                  data-testid="button-delete-item"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('deleteAction')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <CategoryBadge category={category} />
            <span className="text-muted-foreground">{t('quantityColon')} {quantity}</span>
          </div>
          {(estimatedValue || serialNumber || luggageBrand || luggageSize) && (
            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              {estimatedValue && <div>{t('valueColon')} ${estimatedValue.toLocaleString()}</div>}
              {serialNumber && <div>S/N: {serialNumber}</div>}
              {luggageBrand && (
                <div className="flex items-center gap-1">
                  <span>{t('luggageColon')}</span>
                  <span className="font-medium">{luggageBrand}</span>
                  {luggageSize && <span>({getSizeLabel(luggageSize)})</span>}
                </div>
              )}
            </div>
          )}
          {(isSealed || isLocked) && (
            <div className="flex gap-2 mt-2">
              {isSealed && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {t('sealedStatus')}
                </Badge>
              )}
              {isLocked && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Lock className="h-3 w-3" />
                  {t('withLock')}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
