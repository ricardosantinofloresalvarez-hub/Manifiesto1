import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CategoryBadge from './CategoryBadge';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
  onEdit,
  onDelete,
}: ManifestItemCardProps) {
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
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                  data-testid="button-delete-item"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <CategoryBadge category={category} />
            <span className="text-muted-foreground">Cantidad: {quantity}</span>
          </div>
          {(estimatedValue || serialNumber) && (
            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              {estimatedValue && <div>Valor: ${estimatedValue}</div>}
              {serialNumber && <div>S/N: {serialNumber}</div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
