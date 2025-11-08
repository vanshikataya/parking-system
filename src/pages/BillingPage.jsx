import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadData, saveData } from '../utils/storage';

/**
 * Billing calculation:
 * ₹30 per 10 minutes
 * Round up to next 10-minute block.
 */
function calculateCharge(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const ms = Math.max(0, end - start);
  const minutes = Math.ceil(ms / 60000); // round up minutes
  const blocks = Math.max(1, Math.ceil(minutes / 10)); // at least 1 block
  const amount = blocks * 30;
  return { minutes, blocks, amount };
}

function formatCurrency(amount) {
  return `₹${amount}`;
}

function formatIsoLocal(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

export default function BillingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // if user navigated directly here without state, show fallback
  if (!state || !state.slotNumber) {
    return (
      <div className="page">
        <div className="card">
          <h2>Billing</h2>
          <p>No billing info found. Navigate from Admin when freeing a slot.</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate('/admin')}>Go to Admin</button>
          </div>
        </div>
      </div>
    );
  }

  const { lotId, lotName, slotNumber, occupiedAt, reservedAt, reservedBy, freedAt } = state;

  // choose start time: prefer occupiedAt, else reservedAt
  const start = occupiedAt || reservedAt || null;
  const end = freedAt || new Date().toISOString();

  const { minutes, blocks, amount } = start ? calculateCharge(start, end) : { minutes: 0, blocks: 0, amount: 0 };

  // small receipt object
  const receipt = {
    receiptId: `RCPT-${lotId}-${slotNumber}-${Date.now()}`,
    lotId,
    lotName,
    slotNumber,
    vehicle: reservedBy || '—',
    start,
    end,
    minutes,
    blocks,
    amount
  };

  function handleConfirmPayment() {
    // Record the billing info in localStorage (billing logs)
    const logsKey = 'smart_parking_billing_logs_v1';
    const existingLogsRaw = localStorage.getItem(logsKey);
    const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];

    existingLogs.push({
      id: receipt.receiptId,
      lotId: receipt.lotId,
      lotName: receipt.lotName,
      slotNumber: receipt.slotNumber,
      vehicle: receipt.vehicle,
      start: receipt.start,
      end: receipt.end,
      minutes: receipt.minutes,
      blocks: receipt.blocks,
      amount: receipt.amount,
      paidAt: new Date().toISOString()
    });
    localStorage.setItem(logsKey, JSON.stringify(existingLogs));

    alert(`Payment recorded — ${formatCurrency(receipt.amount)}`);
    navigate('/admin');
  }

  function generateReceiptText() {
    return [
      `Smart Parking — Receipt`,
      `Receipt ID: ${receipt.receiptId}`,
      `Lot: ${receipt.lotName} (${receipt.lotId})`,
      `Slot: ${receipt.slotNumber}`,
      `Vehicle: ${receipt.vehicle}`,
      `Start: ${formatIsoLocal(receipt.start)}`,
      `End:   ${formatIsoLocal(receipt.end)}`,
      `Duration: ${receipt.minutes} minutes`,
      `Billing blocks (10 min): ${receipt.blocks}`,
      `Rate: ₹30 per 10 minutes`,
      `Amount Due: ${formatCurrency(receipt.amount)}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Thank you for using Smart Parking!`
    ].join('\n');
  }

  function downloadReceiptTxt() {
    const txt = generateReceiptText();
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openPrintableReceipt() {
    // Create a small HTML receipt for printing
    const html = `
      <html>
        <head>
          <title>Receipt ${receipt.receiptId}</title>
          <style>
            body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; margin: 26px; color: #111; }
            .box { max-width: 520px; margin: 0 auto; border: 1px solid #eee; padding: 18px; border-radius: 8px; }
            h2 { margin: 0 0 8px 0; font-size: 20px; }
            .muted { color: #666; font-size: 13px; }
            .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #f0f0f0; }
            .total { font-weight:700; font-size:18px; padding-top:12px; text-align:right; }
            .small { font-size:12px; color:#777; margin-top:10px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Smart Parking — Receipt</h2>
            <div class="muted">Receipt ID: ${receipt.receiptId}</div>
            <div style="height:10px;"></div>

            <div class="row"><div>Lot</div><div>${receipt.lotName}</div></div>
            <div class="row"><div>Slot</div><div>${receipt.slotNumber}</div></div>
            <div class="row"><div>Vehicle</div><div>${receipt.vehicle}</div></div>
            <div class="row"><div>Start</div><div>${formatIsoLocal(receipt.start)}</div></div>
            <div class="row"><div>End</div><div>${formatIsoLocal(receipt.end)}</div></div>

            <div class="row"><div>Duration (min)</div><div>${receipt.minutes}</div></div>
            <div class="row"><div>Blocks (10 min)</div><div>${receipt.blocks}</div></div>
            <div class="row"><div>Rate</div><div>₹30 / 10 min</div></div>

            <div class="total">Amount: ${formatCurrency(receipt.amount)}</div>

            <div class="small">Generated: ${new Date().toLocaleString()}</div>
            <div class="small">Thank you for using Smart Parking.</div>
          </div>
          <script>
            // auto print dialog
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;
    const w = window.open('', '_blank', 'width=700,height=800');
    if (!w) {
      alert('Popup blocked: allow popups for this site to print.');
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Billing for {slotNumber}</h2>
        <p><strong>Lot:</strong> {lotName || lotId}</p>
        <p><strong>Vehicle:</strong> {reservedBy || '—'}</p>
        <p><strong>Start:</strong> {formatIsoLocal(start)}</p>
        <p><strong>End:</strong> {formatIsoLocal(end)}</p>

        <hr />

        <p><strong>Duration:</strong> {minutes} minutes</p>
        <p><strong>Billing blocks (10 min):</strong> {blocks}</p>
        <h3>Amount: {formatCurrency(amount)}</h3>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={handleConfirmPayment}>Confirm Payment</button>
          <button onClick={() => navigate('/admin')} style={{ background: '#ddd', color: '#111' }}>Skip / Return</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={downloadReceiptTxt}>Download Receipt</button>
            <button onClick={openPrintableReceipt} style={{ background: '#fff', color: '#111', border: '1px solid #ddd' }}>Print Receipt</button>
          </div>
        </div>
      </div>
    </div>
  );
}
