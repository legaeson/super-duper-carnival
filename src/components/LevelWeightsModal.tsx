import { useState } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { X, Check } from 'lucide-react';

interface Props {
  weekId: number;
  onClose: () => void;
}

export function LevelWeightsModal({ weekId, onClose }: Props) {
  const { plan, setWeekLevelWeights } = useWorkout();
  
  const currentWeek = plan.weeks.find(w => w.week === weekId);
  const existingWeights = currentWeek?.levelWeights || {};

  const [heavy, setHeavy] = useState<string>(existingWeights.heavy?.toString() || '60');
  const [medium, setMedium] = useState<string>(existingWeights.medium?.toString() || '50');
  const [light, setLight] = useState<string>(existingWeights.light?.toString() || '30');

  const toLbs = (kgStr: string) => {
    const val = parseFloat(kgStr);
    if (isNaN(val)) return '0 lbs';
    return `${(val * 2.20462).toFixed(1)} lbs`;
  };

  const handleSave = () => {
    const h = parseFloat(heavy);
    const m = parseFloat(medium);
    const l = parseFloat(light);

    setWeekLevelWeights(weekId, {
      heavy: isNaN(h) ? 0 : h,
      medium: isNaN(m) ? 0 : m,
      light: isNaN(l) ? 0 : l
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>
            Веса недели {weekId} (Тяжёлый / Средний / Лёгкий)
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="text-secondary mb-4" style={{ fontSize: '0.85rem' }}>
          Укажите значения весов. Упражнения этой недели автоматически получат соответствующие значения с конвертацией в фунты.
        </p>

        {/* Heavy Weight */}
        <div className="mb-4">
          <label className="text-secondary mb-1 flex justify-between" style={{ fontSize: '0.9rem' }}>
            <span>Тяжёлый вес:</span>
            <span className="font-bold text-primary">≈ {toLbs(heavy)}</span>
          </label>
          <div className="flex items-center gap-2">
            <button className="stepper-btn" onClick={() => setHeavy(prev => Math.max(0, parseFloat(prev || '0') - 2.5).toString())}>-</button>
            <input 
              type="text" 
              readOnly 
              inputMode="none"
              className="input input-number w-full"
              value={`${heavy} кг`}
            />
            <button className="stepper-btn" onClick={() => setHeavy(prev => (parseFloat(prev || '0') + 2.5).toString())}>+</button>
          </div>
        </div>

        {/* Medium Weight */}
        <div className="mb-4">
          <label className="text-secondary mb-1 flex justify-between" style={{ fontSize: '0.9rem' }}>
            <span>Средний вес:</span>
            <span className="font-bold text-primary">≈ {toLbs(medium)}</span>
          </label>
          <div className="flex items-center gap-2">
            <button className="stepper-btn" onClick={() => setMedium(prev => Math.max(0, parseFloat(prev || '0') - 2.5).toString())}>-</button>
            <input 
              type="text" 
              readOnly
              inputMode="none"
              className="input input-number w-full"
              value={`${medium} кг`}
            />
            <button className="stepper-btn" onClick={() => setMedium(prev => (parseFloat(prev || '0') + 2.5).toString())}>+</button>
          </div>
        </div>

        {/* Light Weight */}
        <div className="mb-6">
          <label className="text-secondary mb-1 flex justify-between" style={{ fontSize: '0.9rem' }}>
            <span>Лёгкий вес:</span>
            <span className="font-bold text-primary">≈ {toLbs(light)}</span>
          </label>
          <div className="flex items-center gap-2">
            <button className="stepper-btn" onClick={() => setLight(prev => Math.max(0, parseFloat(prev || '0') - 2.5).toString())}>-</button>
            <input 
              type="text" 
              readOnly
              inputMode="none"
              className="input input-number w-full"
              value={`${light} кг`}
            />
            <button className="stepper-btn" onClick={() => setLight(prev => (parseFloat(prev || '0') + 2.5).toString())}>+</button>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          <Check size={18} /> Применить веса к неделе {weekId}
        </button>
      </div>
    </div>
  );
}
