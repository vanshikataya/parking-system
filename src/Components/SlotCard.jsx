import React from 'react';

export default function SlotCard({ slot, onToggle, onReserve, isAdmin }) {
  const color =
    slot.status === 'free' ? 'slot-free' :
    slot.status === 'occupied' ? 'slot-occupied' :
    slot.status === 'reserved' ? 'slot-reserved' : '';

  return (
    <div className={`slot-card ${color}`}>
      <div className="slot-head">
        <strong>{slot.slotNumber}</strong>
        <span className="slot-type">{slot.type}</span>
      </div>
      <div className="slot-body">
        <div>Status: <em>{slot.status}</em></div>
      </div>
      <div className="slot-actions">
        {isAdmin ? (
          <>
            <button onClick={() => onToggle(slot)}>
              {slot.status === 'free' ? 'Mark Occupied' : 'Mark Free'}
            </button>
            <button onClick={() => onToggle(slot, true)}>Reset</button>
          </>
        ) : (
          <button disabled={slot.status !== 'free'} onClick={() => onReserve(slot)}>
            {slot.status === 'free' ? 'Reserve' : 'Unavailable'}
          </button>
        )}
      </div>
    </div>
  );
}
