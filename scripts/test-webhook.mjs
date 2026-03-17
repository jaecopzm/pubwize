import { Webhook } from 'standardwebhooks';

const secret = 'whsec_zxkYZp+6QLINFYhX7sLQ7ySCWTERc1p0';
const url = 'http://localhost:3000/api/dodo/webhook';

const payload = {
  type: 'subscription.active',
  data: {
    subscription_id: 'sub_test_123',
    customer: { customer_id: 'cus_test_123' },
    price_id: 'pdt_0NaC84fNFPKD9uS4Kbmcx', // starter monthly test price
    next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    metadata: { userId: 'gZeeQRh0y1TnZz7tSgcR9Tg7Lt33' },
  },
};

const body = JSON.stringify(payload);
const msgId = `msg_test_${Date.now()}`;
const timestamp = Math.floor(Date.now() / 1000).toString();

const wh = new Webhook(secret);
const toSign = `${msgId}.${timestamp}.${body}`;
const keyBytes = Buffer.from(secret.replace('whsec_', ''), 'base64');
const { createHmac } = await import('crypto');
const sig = createHmac('sha256', keyBytes).update(toSign).digest('base64');

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'webhook-id': msgId,
    'webhook-timestamp': timestamp,
    'webhook-signature': `v1,${sig}`,
  },
  body,
});

console.log('Status:', res.status);
console.log('Body:', await res.text());
