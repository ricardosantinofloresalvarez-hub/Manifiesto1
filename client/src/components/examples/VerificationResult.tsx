import VerificationResult from '../VerificationResult';

export default function VerificationResultExample() {
  return (
    <div className="min-h-screen bg-background py-8">
      <VerificationResult
        valid={true}
        manifestId="manifest-123"
        userName="Juan Pérez"
        tripTitle="Vacaciones en Cancún"
        itemCount={24}
        timestamp="2025-01-15T10:30:00Z"
        hash="a3f5d8e2b1c4f6a9d7e3b5c8f2a1d9e6"
      />
    </div>
  );
}
