import { QRCodeSVG } from "qrcode.react";

interface RecoveryLabelProps {
  token: string;
  nickname?: string;
}

export default function RecoveryLabel({ token, nickname }: RecoveryLabelProps) {
  const url = `https://manifiesto.app/found/${token}`;
  
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      maxWidth: "320px",
      margin: "0 auto",
      padding: "24px",
      border: "2px solid #000",
      borderRadius: "12px",
      textAlign: "center",
      backgroundColor: "#fff",
      color: "#000"
    }}>
      <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
        🧳 {nickname || "Esta maleta tiene dueño"}
      </p>
      <p style={{ fontSize: "11px", color: "#555", marginBottom: "16px" }}>
        Si la encontraste, escanea el código:
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <QRCodeSVG value={url} size={160} />
      </div>
      <p style={{ fontSize: "10px", color: "#777", marginBottom: "4px" }}>
        El propietario será notificado de inmediato.
      </p>
      <p style={{ fontSize: "10px", color: "#aaa" }}>
        manifiesto.app
      </p>
    </div>
  );
}