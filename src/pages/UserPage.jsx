import React, { useEffect, useState } from 'react';
import { loadData, saveData } from '../utils/storage';
import SlotCard from '../Components/SlotCard';

export default function UserPage() {
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);

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
    const vehicle = prompt('Enter vehicle number:');
    if (!vehicle) return;

    const next = lots.map(l => {
      if (l.id !== lotId) return l;
      const slots = l.slots.map(s => s.slotNumber === slotNumber
        ? { ...s, status: 'reserved', reservedBy: vehicle, reservedAt: new Date().toISOString() }
        : s);
      return { ...l, slots };
    });
    persist(next);
    alert('Slot reserved!');
  }

  const selectedLot = lots.find(l => l.id === selectedLotId);

  return (
    <div className="page user">
      <h2>User View</h2>
      {lots.length === 0 && <p>No lots available yet.</p>}
      {lots.length > 0 && (
        <div className="card">
          <label>Choose lot</label>
          <select value={selectedLotId || ''} onChange={e => setSelectedLotId(e.target.value)}>
            {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          {selectedLot && (
            <>
              <h3>{selectedLot.name}</h3>
              <div className="slots-grid">
                {selectedLot.slots.map(s => (
                  <SlotCard
                    key={s.slotNumber}
                    slot={s}
                    isAdmin={false}
                    onReserve={() => handleReserve(selectedLot.id, s.slotNumber)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
