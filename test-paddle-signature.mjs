import crypto from 'crypto';

const secret = process.env.PADDLE_WEBHOOK_SECRET;
if (!secret) {
  console.error('❌ PADDLE_WEBHOOK_SECRET no está disponible en esta Shell.');
  process.exit(1);
}

const payload = JSON.stringify({
  event_type: "transaction.completed",
  data: {
    id: "txn_test_" + Date.now(),
    custom_data: { userId: "test-user-id", productId: "pack3" }
  }
});

const ts = Math.floor(Date.now() / 1000);
const signedPayload = `${ts}:${payload}`;
const h1 = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

console.log('--- Copia y corre este comando (firma VÁLIDA) ---');
console.log(`curl -s -X POST http://localhost:5000/api/paddle/webhook -H "Content-Type: application/json" -H "Paddle-Signature: ts=${ts};h1=${h1}" -d '${payload}'`);
console.log('');
console.log('--- Y este otro (firma INVÁLIDA a propósito, para confirmar que sí detecta falsos) ---');
console.log(`curl -s -X POST http://localhost:5000/api/paddle/webhook -H "Content-Type: application/json" -H "Paddle-Signature: ts=${ts};h1=0000000000000000000000000000000000000000000000000000000000000000" -d '${payload}'`);
