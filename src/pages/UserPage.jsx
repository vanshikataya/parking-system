import React, { useEffect, useState } from 'react';
import { loadData, saveData } from '../utils/storage';
import SlotCard from '../components/SlotCard';
import PreferenceModal from '../Components/PreferenceModel';

export default function UserPage() {
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastAllocated, setLastAllocated] = useState(null);

  useEffect(() => {
    const data = loadData();
    setLots(data);
    if (data.length > 0 && !selectedLotId) setSelectedLotId(data[0].id);
  }, []);

  function persist(nextLots) {
    setLots(nextLots);
    saveData(nextLots);
  }

  function handleReserve(lotId, slotNumber) {
    const vehicle = prompt('Enter vehicle number (e.g., MH12AB1234):');
    if (!vehicle) return;

    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => s.slotNumber === slotNumber
        ? { ...s, status: 'reserved', reservedBy: vehicle, reservedAt: new Date().toISOString() }
        : s);
      return { ...l, slots };
    });
    persist(next);
    alert(`Reserved ${slotNumber} in lot.`);
  }

  function handleCancelReservation(lotId, slotNumber) {
    if (!confirm('Cancel reservation?')) return;
    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => s.slotNumber === slotNumber ? { ...s, status: 'free', reservedBy: undefined, reservedAt: undefined } : s);
      return { ...l, slots };
    });
    persist(next);
  }

  // SMART ALLOCATION
  function allocateSlotForPreference(lotId, { vehicleType, vehicleModel, needCharging }) {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) {
      alert('Selected lot not found.');
      return;
    }

    // 1. try exact type + charging if requested
    let slot = lot.slots.find(s => s.status === 'free' && s.type === vehicleType && (!needCharging || !!s.charging));
    // 2. fallback: exact type, any charging
    if (!slot) slot = lot.slots.find(s => s.status === 'free' && s.type === vehicleType);
    // 3. fallback: any free slot (if user allows)
    if (!slot) slot = lot.slots.find(s => s.status === 'free');

    if (!slot) {
      alert('No free slots available matching preferences. Try another lot or come later.');
      return;
    }

    // perform reservation
    const vehicleNumber = vehicleModel || prompt('Enter vehicle number (e.g., MH12AB1234):');
    if (!vehicleNumber) {
      alert('Reservation cancelled — vehicle number required.');
      return;
    }

    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => s.slotNumber === slot.slotNumber
        ? { ...s, status: 'reserved', reservedBy: vehicleNumber, reservedAt: new Date().toISOString(), reservedFor: { vehicleType, vehicleModel, needCharging } }
        : s);
      return { ...l, slots };
    });

    persist(next);
    setLastAllocated({ lotId, slotNumber: slot.slotNumber, vehicleNumber, vehicleType, needCharging });
    alert(`Allocated slot ${slot.slotNumber} for you.`);
    setModalOpen(false);
  }

  const selectedLot = lots.find(l => l.id === selectedLotId) || null;

  return (
    <div className="page user">
      <h2>User View</h2>

      {lots.length === 0 && <p>No lots available yet. Ask Admin to create one.</p>}

      <div className="card">
        <label>Choose lot</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selectedLotId || ''} onChange={e => setSelectedLotId(e.target.value)} style={{ flex: 1 }}>
            {lots.map(l => <option key={l.id} value={l.id}>{l.name} — {l.address || 'no address'}</option>)}
          </select>

          <button onClick={() => setModalOpen(true)} style={{ minWidth: 140 }}>
            Find Slot (based on preference)
          </button>
        </div>

        {selectedLot && (
          <>
            <h3 style={{ marginTop: 12 }}>{selectedLot.name}</h3>
            <div className="slots-grid">
              {selectedLot.slots.map(s => (
                <SlotCard
                  key={s.slotNumber}
                  slot={s}
                  isAdmin={false}
                  onReserve={() => {
                    // direct reserve via slot card - asks vehicle number
                    handleReserve(selectedLot.id, s.slotNumber);
                  }}
                />
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <h4>Your reservations in this lot</h4>
              <ul>
                {selectedLot.slots.filter(s => s.status === 'reserved').map(s => (
                  <li key={s.slotNumber} style={{ marginBottom: 6 }}>
                    {s.slotNumber} — reserved by <strong>{s.reservedBy || 'unknown'}</strong>
                    {s.reservedFor && <span style={{ marginLeft: 8, color: '#666' }}>({s.reservedFor.vehicleType}{s.reservedFor.needCharging ? ' +charging' : ''})</span>}
                    <button onClick={() => handleCancelReservation(selectedLot.id, s.slotNumber)} style={{ marginLeft: 8 }}>Cancel</button>
                  </li>
                ))}
                {selectedLot.slots.filter(s => s.status === 'reserved').length === 0 && <li>No reservations</li>}
              </ul>
            </div>
          </>
        )}
      </div>

      <PreferenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={selectedLot?.slots?.[0]?.type || 'car'}
        onSubmit={(pref) => {
          if (!selectedLotId) { alert('Select a lot first'); return; }
          allocateSlotForPreference(selectedLotId, pref);
        }}
      />

      {lastAllocated && (
        <div style={{ position: 'fixed', right: 18, bottom: 18, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}>
          <div style={{ fontSize: 13 }}>Last allocation:</div>
          <div style={{ fontWeight: 700 }}>{lastAllocated.slotNumber}</div>
          <div style={{ color: '#666', fontSize: 13 }}>{lastAllocated.vehicleType}{lastAllocated.needCharging ? ' • charging required' : ''}</div>
        </div>
      )}
    </div>
  );
}
