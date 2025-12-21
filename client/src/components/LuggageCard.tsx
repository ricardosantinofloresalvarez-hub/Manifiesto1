import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Lock, 
  Shield, 
  Pencil, 
  Trash2,
  CheckCircle2
} from 'lucide-react';
import type { Luggage } from '@shared/schema';
import { LUGGAGE_SIZES, LUGGAGE_TYPE_OPTIONS } from '@/constants/manifestItems';

interface LuggageCardProps {
  luggage: Luggage;
  onEdit?: (luggage: Luggage) => void;
  onDelete?: (luggage: Luggage) => void;
  onClick?: (luggage: Luggage) => void;
}

export default function LuggageCard({
  luggage,
  onEdit,
  onDelete,
  onClick,
}: LuggageCardProps) {
  const sizeLabel = LUGGAGE_SIZES.find(s => s.value === luggage.size)?.label || luggage.size;
  const typeLabel = LUGGAGE_TYPE_OPTIONS.find(t => t.value === luggage.type)?.label || luggage.type;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(luggage);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(luggage);
  };

  const displayName = luggage.nickname || typeLabel || 'Maleta';
  const hasCertificate = !!luggage.certificateHash;

  return (
    <Card
      className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer relative group"
      onClick={() => onClick?.(luggage)}
      data-testid={`card-luggage-${luggage.id}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-base truncate" data-testid={`text-luggage-name-${luggage.id}`}>
                {displayName}
              </h4>
              <p className="text-sm text-muted-foreground truncate">
                {luggage.brand && `${luggage.brand} • `}
                {sizeLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                data-testid={`button-edit-luggage-${luggage.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                data-testid={`button-delete-luggage-${luggage.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {luggage.color && (
            <Badge variant="secondary" className="text-xs">
              {luggage.color}
            </Badge>
          )}
          {luggage.isSealed && (
            <Badge variant="outline" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              Sellada
            </Badge>
          )}
          {luggage.isLocked && (
            <Badge variant="outline" className="text-xs gap-1">
              <Lock className="h-3 w-3" />
              Candado
            </Badge>
          )}
          {hasCertificate && (
            <Badge variant="default" className="text-xs gap-1 bg-primary/90">
              <CheckCircle2 className="h-3 w-3" />
              Certificada
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
