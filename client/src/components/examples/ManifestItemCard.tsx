import ManifestItemCard from '../ManifestItemCard';
import cameraImg from '@assets/generated_images/Sample_camera_item_1b3b205a.png';
import laptopImg from '@assets/generated_images/Sample_laptop_item_6d043e96.png';
import headphonesImg from '@assets/generated_images/Sample_headphones_item_73b302f6.png';

export default function ManifestItemCardExample() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <ManifestItemCard
          id="1"
          name="Cámara Sony A7 III"
          category="electronics"
          quantity={1}
          estimatedValue={2000}
          serialNumber="SN123456789"
          imageUrl={cameraImg}
          onEdit={() => console.log('Edit camera')}
          onDelete={() => console.log('Delete camera')}
        />
        <ManifestItemCard
          id="2"
          name="MacBook Pro 16''"
          category="electronics"
          quantity={1}
          estimatedValue={2500}
          serialNumber="MBPRO2024"
          imageUrl={laptopImg}
          onEdit={() => console.log('Edit laptop')}
          onDelete={() => console.log('Delete laptop')}
        />
        <ManifestItemCard
          id="3"
          name="Auriculares Sony WH-1000XM5"
          category="electronics"
          quantity={1}
          estimatedValue={350}
          imageUrl={headphonesImg}
          onEdit={() => console.log('Edit headphones')}
          onDelete={() => console.log('Delete headphones')}
        />
      </div>
    </div>
  );
}
