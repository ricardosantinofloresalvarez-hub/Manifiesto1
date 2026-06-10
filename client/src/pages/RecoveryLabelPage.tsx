import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function RecoveryLabelPage() {
  const { token } = useParams();
  const [luggage, setLuggage] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/found/${token}`)
      .then(r => r.json())
      .then(data => { if (data.found) setLuggage(data.luggage); });
  }, [token]);

  useEffect(() => {
    if (luggage) setTimeout(() => window.print(), 500);
  }, [luggage]);

  if (!luggage) return <div style={{textAlign:"center",padding:"40px"}}>Cargando...</div>;

  const url = `https://manifiesto.app/found/${token}`;

  return (
    <div style={{
      fontFamily: "Georgia, serif",
      maxWidth: "320px",
      margin: "40px auto",
      padding: "24px",
      border: "2px solid #000",
      borderRadius: "12px",
      textAlign: "center",
      backgroundColor: "#fff",
      color: "#000"
    }}>
      <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
        🧳 {luggage.nickname || "Esta maleta tiene dueño"}
      </p>
      <p style={{ fontSize: "12px", color: "#555", marginBottom: "16px" }}>
        Si la encontraste, escanea este código:
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <QRCodeSVG value={url} size={180} />
      </div>
      <p style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>
        El propietario será notificado de inmediato.
      </p>
      <p style={{ fontSize: "11px", color: "#aaa" }}>manifiesto.app</p>
    </div>
  );
}