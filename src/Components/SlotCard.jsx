import React from 'react';

/**
 * Props:
 *  - slot: { slotNumber, type, status, charging }
 *  - isAdmin: boolean
 *  - onToggle(slot, forceReset) => toggles occupied/free or reset
 *  - onReserve(slot) => used by user view
 */
export default function SlotCard({ slot, onToggle, onReserve, isAdmin }) {
  const color =
    slot.status === 'free' ? 'slot-free' :
    slot.status === 'occupied' ? 'slot-occupied' :
    slot.status === 'reserved' ? 'slot-reserved' : '';

  return (
    <div className={`slot-card ${color}`} style={{ position: 'relative' }}>
      <div className="slot-head">
        <strong>{slot.slotNumber}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="slot-type">{slot.type === 'bigcar' ? 'big' : slot.type}</span>
          {slot.charging && (
            <span title="Charging port available" style={{ fontSize: 14 }}>
              🔌
            </span>
          )}
        </div>
      </div>

      <div className="slot-body">
        <div>Status: <em>{slot.status}</em></div>
      </div>

      <div className="slot-actions">
        {isAdmin ? (
          <>
            <button onClick={() => onToggle && onToggle(slot.slotNumber)}>
              {slot.status === 'free' ? 'Mark Occupied' : 'Mark Free'}
            </button>
            <button onClick={() => onToggle && onToggle(slot.slotNumber, true)}>Reset</button>
          </>
        ) : (
          <button disabled={slot.status !== 'free'} onClick={() => onReserve && onReserve(slot.slotNumber)}>
            {slot.status === 'free' ? 'Reserve' : 'Unavailable'}
          </button>
        )}
      </div>
    </div>
  );
}
