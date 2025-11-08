import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { loadData, saveData, resetData } from '../utils/storage';
import SlotCard from '../components/SlotCard';

function makeSlots({ cars = 0, bikes = 0, bigCars = 0 }) {
  const slots = [];
  for (let i = 1; i <= cars; i++) {
    slots.push({ slotNumber: `C${i}`, type: 'car', status: 'free', charging: false });
  }
  for (let i = 1; i <= bikes; i++) {
    slots.push({ slotNumber: `M${i}`, type: 'motorcycle', status: 'free', charging: false });
  }
  for (let i = 1; i <= bigCars; i++) {
    slots.push({ slotNumber: `B${i}`, type: 'bigcar', status: 'free', charging: false });
  }
  return slots;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // counts
  const [carsCount, setCarsCount] = useState(2);
  const [bikesCount, setBikesCount] = useState(1);
  const [bigCarsCount, setBigCarsCount] = useState(0);

  // generated preview slots before creating the lot
  const [previewSlots, setPreviewSlots] = useState([]);

  useEffect(() => {
    setLots(loadData());
  }, []);

  function persist(next) {
    setLots(next);
    saveData(next);
  }

  function handleGenerateSlots(e) {
    e && e.preventDefault();
    const generated = makeSlots({
      cars: Number(carsCount) || 0,
      bikes: Number(bikesCount) || 0,
      bigCars: Number(bigCarsCount) || 0,
    });
    setPreviewSlots(generated);
  }

  function togglePreviewCharging(slotNumber) {
    setPreviewSlots(prev => prev.map(s => s.slotNumber === slotNumber ? { ...s, charging: !s.charging } : s));
  }

  function handleCreateLot(e) {
    e && e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a lot name.');
      return;
    }
    if (previewSlots.length === 0) {
      alert('Generate slots first (use "Generate Slots").');
      return;
    }

    const lot = {
      id: uuidv4(),
      name: name.trim(),
      address: address.trim(),
      slots: previewSlots.map(s => ({ ...s }))
    };

    persist([ ...lots, lot ]);
    setName('');
    setAddress('');
    setPreviewSlots([]);
    alert('Lot created!');
  }

  function handleDeleteLot(lotId) {
    if (!confirm('Delete lot?')) return;
    persist(lots.filter(l => l.id !== lotId));
  }

  function clearAll() {
    if (!confirm('Clear all data from localStorage?')) return;
    resetData();
    setLots([]);
  }

  // admin toggle charging on already created lot slot
  function handleToggleCharging(lotId, slotNumber) {
    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => s.slotNumber === slotNumber ? { ...s, charging: !s.charging } : s);
      return { ...l, slots };
    });
    persist(next);
  }

  // admin toggle occupied/free (sets occupiedAt when occupied, and opens billing when freed)
  function handleToggleSlotStatus(lotId, slotNumber, forceReset=false) {
    let freedSlotInfo = null; // if we free a slot, store info to navigate to billing
    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => {
        if (s.slotNumber !== slotNumber) return s;

        // reset to free
        if (forceReset) {
          // if was occupied/reserved, we may treat as force-free (no billing)
          const previous = s;
          s = { ...s, status: 'free', reservedBy: undefined, reservedAt: undefined, reservedFor: undefined, occupiedAt: undefined };
          return s;
        }

        // toggle occupied/free
        if (s.status === 'free' || s.status === 'reserved') {
          // mark occupied (car arrived). record occupiedAt
          return { ...s, status: 'occupied', occupiedAt: new Date().toISOString() };
        } else if (s.status === 'occupied') {
          // freeing the slot — capture data for billing and set status free
          // preserve previous occupiedAt/reservedBy for billing
          freedSlotInfo = { lotId: l.id, lotName: l.name, slotNumber: s.slotNumber, occupiedAt: s.occupiedAt, reservedAt: s.reservedAt, reservedBy: s.reservedBy };
          return { ...s, status: 'free', occupiedAt: undefined, reservedAt: undefined, reservedBy: undefined, reservedFor: undefined };
        }
        return s;
      });
      return { ...l, slots };
    });

    persist(next);

    // if we freed a slot with info, navigate to billing page
    if (freedSlotInfo) {
      // navigate to /billing and pass state including freedAt = now
      navigate('/billing', { state: { ...freedSlotInfo, freedAt: new Date().toISOString() } });
    }
  }

  return (
    <div className="page admin">
      <h2>Admin Dashboard</h2>

      <section className="card">
        <h3>Create Parking Lot</h3>

        <form onSubmit={handleGenerateSlots}>
          <div className="form-row" style={{ gap: 12 }}>
            <input placeholder="Lot name" value={name} onChange={e => setName(e.target.value)} />
            <input placeholder="Address (optional)" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Car slots</label>
              <input type="number" min="0" value={carsCount} onChange={e => setCarsCount(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Motorcycle slots</label>
              <input type="number" min="0" value={bikesCount} onChange={e => setBikesCount(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Big car slots</label>
              <input type="number" min="0" value={bigCarsCount} onChange={e => setBigCarsCount(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={handleGenerateSlots}>Generate Slots</button>
            <button type="button" onClick={handleCreateLot} style={{ marginLeft: 8 }}>Create Lot</button>
          </div>
        </form>

        <div style={{ marginTop: 16 }}>
          <h4>Preview Slots</h4>
          {previewSlots.length === 0 && <div style={{ color: '#666' }}>No slots generated yet. Click "Generate Slots".</div>}
          <div className="slots-grid" style={{ marginTop: 8 }}>
            {previewSlots.map(s => (
              <div key={s.slotNumber} style={{ width: 140 }}>
                <SlotCard slot={s} isAdmin={true} onToggle={() => {}} onReserve={() => {}} />
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                    <input type="checkbox" checked={!!s.charging} onChange={() => togglePreviewCharging(s.slotNumber)} />
                    <span>Charging port</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Existing Lots</h3>
        {lots.length === 0 && <p>No lots yet.</p>}
        <div className="lots-grid">
          {lots.map(lot => (
            <div key={lot.id} className="lot">
              <div className="lot-head">
                <h4>{lot.name}</h4>
                <small>{lot.address}</small>
                <div className="lot-actions">
                  <button onClick={() => handleDeleteLot(lot.id)}>Delete</button>
                </div>
              </div>

              <div className="slots-grid" style={{ marginTop: 8 }}>
                {lot.slots.map(s => (
                  <div key={s.slotNumber} style={{ width: 140 }}>
                    <SlotCard
                      slot={s}
                      isAdmin={true}
                      onToggle={() => handleToggleSlotStatus(lot.id, s.slotNumber)}
                      onReserve={() => {}}
                    />
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 13 }}>
                        <input type="checkbox" checked={!!s.charging} onChange={() => handleToggleCharging(lot.id, s.slotNumber)} />
                        <span style={{ marginLeft: 6 }}>Charging</span>
                      </label>
                      <div style={{ fontSize: 12, color: '#666' }}>{s.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={clearAll} className="danger">Clear all local data</button>
        </div>
      </section>
    </div>
  );
}
