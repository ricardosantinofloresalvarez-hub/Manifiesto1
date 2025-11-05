import EmptyState from '../EmptyState';

export default function EmptyStateExample() {
  return (
    <div className="min-h-screen bg-background">
      <EmptyState
        title="No tienes viajes aún"
        description="Comienza creando tu primer viaje para organizar tu equipaje"
        actionLabel="Crear Viaje"
        onAction={() => console.log('Create trip clicked')}
      />
    </div>
  );
}
