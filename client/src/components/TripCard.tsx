import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Package, CheckCircle2 } from 'lucide-react';
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
}

export default function TripCard({
  title,
  destination,
  startDate,
  endDate,
  itemCount,
  verified,
  imageUrl,
  onClick,
}: TripCardProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM', { locale: es });
  };

  return (
    <Card
      className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
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
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
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
  );
}
