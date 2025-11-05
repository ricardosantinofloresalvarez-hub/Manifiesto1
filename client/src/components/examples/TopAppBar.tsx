import TopAppBar from '../TopAppBar';

export default function TopAppBarExample() {
  return (
    <div className="min-h-screen bg-background">
      <TopAppBar
        title="Mi Viaje a Cancún"
        onBack={() => console.log('Back clicked')}
        onAction={() => console.log('Add clicked')}
        actionIcon="plus"
      />
      <div className="p-4">
        <p className="text-muted-foreground">Content goes here</p>
      </div>
    </div>
  );
}
