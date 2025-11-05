import { Badge } from '@/components/ui/badge';
import { Laptop, Shirt, FileText, Watch, Package } from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
}

const categoryConfig = {
  electronics: { icon: Laptop, label: 'Electrónicos', variant: 'default' as const },
  clothing: { icon: Shirt, label: 'Ropa', variant: 'secondary' as const },
  documents: { icon: FileText, label: 'Documentos', variant: 'outline' as const },
  accessories: { icon: Watch, label: 'Accesorios', variant: 'secondary' as const },
  other: { icon: Package, label: 'Otro', variant: 'outline' as const },
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
