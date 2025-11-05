import TripCard from '../TripCard';
import beachImg from '@assets/generated_images/Beach_destination_photo_a88a2d29.png';
import mountainImg from '@assets/generated_images/Mountain_destination_photo_988c16a1.png';

export default function TripCardExample() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        <TripCard
          id="1"
          title="Vacaciones en Cancún"
          destination="Cancún, México"
          startDate="2025-06-15"
          endDate="2025-06-22"
          itemCount={24}
          verified={true}
          imageUrl={beachImg}
          onClick={() => console.log('Trip 1 clicked')}
        />
        <TripCard
          id="2"
          title="Aventura en los Alpes"
          destination="Chamonix, Francia"
          startDate="2025-12-01"
          endDate="2025-12-10"
          itemCount={18}
          verified={false}
          imageUrl={mountainImg}
          onClick={() => console.log('Trip 2 clicked')}
        />
      </div>
    </div>
  );
}
