import doReferralCredit from './doReferralCredit';

export default async function handleInvoicePaid(event) {
  const invoice = event.data.object;

  if (!invoice.amount_paid || invoice.amount_paid === 0) {
    console.log('⚠️ Skipping 0-amount invoice');
    return;
  }

  const customerId = invoice.customer;
  if (!customerId) {
    console.log('❌ No customer ID found on invoice');
    return;
  }

  console.log('🎯 Passing invoice to referral logic');
  await doReferralCredit(customerId);
}