import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Laptop, Shirt, FileText, Watch, Package, Footprints, Sparkles, Pill, Box } from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
}

const categoryIcons = {
  electronics: Laptop,
  clothing: Shirt,
  footwear: Footprints,
  beauty: Sparkles,
  documents: FileText,
  accessories: Watch,
  medicine: Pill,
  other: Box,
};

const categoryVariants = {
  electronics: 'default' as const,
  clothing: 'secondary' as const,
  footwear: 'secondary' as const,
  beauty: 'secondary' as const,
  documents: 'outline' as const,
  accessories: 'secondary' as const,
  medicine: 'outline' as const,
  other: 'outline' as const,
};

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const { t } = useTranslation();

  const Icon = categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.other;
  const variant = categoryVariants[category as keyof typeof categoryVariants] || categoryVariants.other;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      <span>{t(category)}</span>
    </Badge>
  );
}