import CategoryBadge from '../CategoryBadge';

export default function CategoryBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <CategoryBadge category="electronics" />
      <CategoryBadge category="clothing" />
      <CategoryBadge category="documents" />
      <CategoryBadge category="accessories" />
      <CategoryBadge category="other" />
    </div>
  );
}
