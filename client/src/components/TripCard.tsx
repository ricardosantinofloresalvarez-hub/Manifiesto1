import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Calendar, Package, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  itemCount: number;
  verified: boolean;
  imageUrl?: string;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

export default function TripCard({
  id,
  title,
  destination,
  startDate,
  endDate,
  itemCount,
  verified,
  imageUrl,
  onClick,
  onDelete,
}: TripCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM', { locale: es });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se active el onClick de la card
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card
        className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer relative group"
        onClick={onClick}
        data-testid="card-trip"
      >
        {imageUrl && (
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {verified && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="gap-1 bg-primary/90">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Verificado</span>
                </Badge>
              </div>
            )}
            {/* Delete button - appears on hover */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 shadow-lg"
                onClick={handleDelete}
                data-testid="button-delete-trip"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg mb-2 flex-1">{title}</h3>
            {!imageUrl && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                data-testid="button-delete-trip"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{destination}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{itemCount} artículos</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar "{title}"? Esta acción no se puede deshacer.
              Se eliminarán también todos los artículos del manifiesto y certificados asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}