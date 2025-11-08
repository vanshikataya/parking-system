import React, { useState } from 'react';

export default function PreferenceModal({ open, onClose, onSubmit, defaultType = 'car' }) {
  const [vehicleType, setVehicleType] = useState(defaultType);
  const [vehicleModel, setVehicleModel] = useState('');
  const [needCharging, setNeedCharging] = useState(false);

  // reset when modal closes/open
  React.useEffect(() => {
    if (!open) {
      setVehicleType(defaultType);
      setVehicleModel('');
      setNeedCharging(false);
    }
  }, [open, defaultType]);

  if (!open) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h3 style={{ marginTop: 0 }}>Find a slot — specify your preference</h3>

        <label style={styles.row}>
          Vehicle type
          <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={styles.select}>
            <option value="car">Car</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bigcar">Big car / SUV</option>
          </select>
        </label>

        <label style={styles.row}>
          Vehicle model (optional)
          <input placeholder="e.g., XUV500, Tesla Model 3" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} style={styles.input}/>
        </label>

        <label style={{ ...styles.row, alignItems: 'center' }}>
          <input type="checkbox" checked={needCharging} onChange={e => setNeedCharging(e.target.checked)} />
          <span style={{ marginLeft: 8 }}>Require charging port</span>
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} style={{ background: '#ddd', color: '#111' }}>Cancel</button>
          <button onClick={() => onSubmit({ vehicleType, vehicleModel, needCharging })}>Find Slot</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10,10,15,0.35)', zIndex: 9999
  },
  modal: {
    width: 420, maxWidth: '92%', background: '#fff', padding: 18, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
  },
  row: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 },
  input: { padding: 8, borderRadius: 8, border: '1px solid #e3e8ef' },
  select: { padding: 8, borderRadius: 8, border: '1px solid #e3e8ef' }
};
