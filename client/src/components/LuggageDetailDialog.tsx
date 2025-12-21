import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FileText,
  Lock,
  ShieldCheck,
  Package,
  AlertCircle,
} from 'lucide-react';
import { useManifestItems } from '@/hooks/useManifestItems';
import ManifestItemCard from '@/components/ManifestItemCard';
import type { Luggage, ManifestItem } from '@shared/schema';
import {
  LUGGAGE_SIZES,
  LUGGAGE_TYPE_OPTIONS,
} from '@/constants/manifestItems';

interface LuggageDetailDialogProps {
  luggage: Luggage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem?: () => void;
  onEditItem?: (item: ManifestItem) => void;
  onDeleteItem?: (item: ManifestItem) => void;
  onGenerateCertificate?: () => void;
}

export default function LuggageDetailDialog({
  luggage,
  open,
  onOpenChange,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onGenerateCertificate,
}: LuggageDetailDialogProps) {
  const { data: items, isLoading, error } = useManifestItems(luggage?.id ?? null);

  const getSizeLabel = (size: string | null | undefined) => {
    if (!size) return null;
    const found = LUGGAGE_SIZES.find((s) => s.value === size);
    return found?.label || size;
  };

  const getTypeLabel = (type: string | null | undefined) => {
    if (!type) return null;
    const found = LUGGAGE_TYPE_OPTIONS.find((t) => t.value === type);
    return found?.label || type;
  };

  const getColorLabel = (color: string | null | undefined) => {
    if (!color) return null;
    return color;
  };

  const totalValue = items?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
  const itemCount = items?.length || 0;

  if (!luggage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {luggage.nickname || luggage.brand || 'Maleta'}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {luggage.brand && (
              <Badge variant="outline" data-testid="badge-luggage-brand">
                {luggage.brand}
              </Badge>
            )}
            {luggage.type && (
              <Badge variant="outline" data-testid="badge-luggage-type">
                {getTypeLabel(luggage.type)}
              </Badge>
            )}
            {luggage.size && (
              <Badge variant="outline" data-testid="badge-luggage-size">
                {getSizeLabel(luggage.size)}
              </Badge>
            )}
            {luggage.color && (
              <Badge variant="outline" data-testid="badge-luggage-color">
                {getColorLabel(luggage.color)}
              </Badge>
            )}
            {luggage.isSealed && (
              <Badge variant="secondary" className="gap-1" data-testid="badge-sealed">
                <ShieldCheck className="h-3 w-3" />
                Sellada
              </Badge>
            )}
            {luggage.isLocked && (
              <Badge variant="secondary" className="gap-1" data-testid="badge-locked">
                <Lock className="h-3 w-3" />
                Con Candado
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span data-testid="text-item-count">{itemCount} artículo{itemCount !== 1 ? 's' : ''}</span>
            {totalValue > 0 && (
              <span data-testid="text-total-value">
                Valor total: ${totalValue.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddItem}
              data-testid="button-add-item"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Artículo
            </Button>
            <Button
              size="sm"
              onClick={onGenerateCertificate}
              disabled={itemCount === 0}
              data-testid="button-generate-certificate"
            >
              <FileText className="h-4 w-4 mr-1" />
              Generar Certificado
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 pr-4 py-3">
            {isLoading && (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Error al cargar artículos</span>
              </div>
            )}

            {!isLoading && !error && items && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-1">Sin artículos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta maleta aún no tiene artículos registrados.
                </p>
                <Button variant="outline" onClick={onAddItem} data-testid="button-add-first-item">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar primer artículo
                </Button>
              </div>
            )}

            {!isLoading && !error && items && items.length > 0 && (
              items.map((item) => (
                <ManifestItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  category={item.category}
                  quantity={item.quantity}
                  estimatedValue={item.value ?? undefined}
                  serialNumber={item.serialNumber ?? undefined}
                  imageUrl={item.photoUrl ?? undefined}
                  onEdit={() => onEditItem?.(item)}
                  onDelete={() => onDeleteItem?.(item)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
