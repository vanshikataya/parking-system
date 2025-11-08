import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadData, saveData, resetData } from '../utils/storage';
import SlotCard from '../Components/SlotCard';

export default function AdminPage() {
  const [lots, setLots] = useState([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [slotsText, setSlotsText] = useState('A1:car\nA2:car\nB1:motorcycle');

  useEffect(() => { setLots(loadData()); }, []);

  function persist(next) { setLots(next); saveData(next); }

  function handleCreateLot(e) {
    e.preventDefault();
    const parsedSlots = slotsText.split('\n')
      .map(l => l.trim()).filter(Boolean)
      .map(line => {
        const [slotNumber, type='car'] = line.split(':').map(s=>s.trim());
        return { slotNumber, type, status: 'free' };
      });
    const lot = { id: uuidv4(), name: name || `Lot ${Date.now()}`, address, slots: parsedSlots };
    persist([...lots, lot]);
    setName(''); setAddress('');
    alert('Lot created');
  }

  function handleToggleSlot(lotId, slotNumber, forceReset=false) {
    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => {
        if (s.slotNumber !== slotNumber) return s;
        if (forceReset) return { ...s, status: 'free' };
        const status = s.status === 'free' ? 'occupied' : 'free';
        return { ...s, status };
      });
      return { ...l, slots };
    });
    persist(next);
  }

  function handleDeleteLot(lotId) {
    if (!confirm('Delete lot?')) return;
    persist(lots.filter(l => l.id !== lotId));
  }

  function clearAll() {
    if (!confirm('Clear all data from localStorage?')) return;
    resetData(); setLots([]);
  }

  return (
    <div className="page admin">
      <h2>Admin Dashboard</h2>

      <section className="card">
        <h3>Create Parking Lot</h3>
        <form onSubmit={handleCreateLot}>
          <div className="form-row">
            <input placeholder="Lot name" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="Address (optional)" value={address} onChange={e=>setAddress(e.target.value)} />
          </div>
          <div>
            <label>Slots (one per line: SLOT:TYPE)</label>
            <textarea rows={4} value={slotsText} onChange={e=>setSlotsText(e.target.value)} />
          </div>
          <button type="submit">Create Lot</button>
        </form>
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
              <div className="slots-grid">
                {lot.slots.map(s => (
                  <SlotCard
                    key={s.slotNumber}
                    slot={s}
                    isAdmin={true}
                    onToggle={() => handleToggleSlot(lot.id, s.slotNumber)}
                  />
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
