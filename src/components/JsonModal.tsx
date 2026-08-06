import React, { useState } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { X, Upload, Download, Copy, Check, RefreshCw } from 'lucide-react';
import type { WorkoutPlan } from '../types';

interface Props {
  onClose: () => void;
}

const SAMPLE_JSON_SCHEMA = `{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "label": "Понедельник",
          "exercises": [
            {
              "id": "squat",
              "name": "Присед со штангой",
              "sets": 3,
              "targetReps": 10,
              "targetWeight": 50,
              "weightLevel": "тяжёлая"
            }
          ]
        }
      ]
    }
  ]
}`;

export function JsonModal({ onClose }: Props) {
  const { plan, setPlan, resetToDefaultPlan } = useWorkout();
  const [jsonText, setJsonText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSpec, setShowSpec] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        validateAndSave(parsed);
      } catch (err: any) {
        setErrorMsg('Ошибка чтения JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      validateAndSave(parsed);
    } catch (err: any) {
      setErrorMsg('Невалидный JSON: ' + err.message);
    }
  };

  const validateAndSave = (data: any) => {
    if (!data || !Array.isArray(data.weeks)) {
      setErrorMsg('Неверный формат: объект должен содержать массив "weeks"');
      return;
    }

    setPlan(data as WorkoutPlan);
    setErrorMsg(null);
    alert('План тренировок успешно импортирован!');
    onClose();
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'workout_plan.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(SAMPLE_JSON_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-primary" style={{ fontSize: '1.2rem' }}>Управление Планом (JSON)</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="recommendation-banner mb-4" style={{ borderColor: 'var(--primary-color)' }}>
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* Upload File */}
        <div className="mb-4">
          <label className="btn btn-secondary w-full" style={{ cursor: 'pointer', textAlign: 'center' }}>
            <Upload size={18} /> Загрузить .json файл
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Textarea Import */}
        <div className="mb-4">
          <textarea
            className="input mb-2"
            rows={5}
            placeholder="Или вставьте код JSON сюда..."
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <button className="btn btn-primary" onClick={handlePasteImport}>
            Импортировать вставленный JSON
          </button>
        </div>

        {/* Reset to Excel default */}
        <div className="mb-4">
          <button className="btn btn-secondary" onClick={() => { resetToDefaultPlan(); onClose(); }}>
            <RefreshCw size={18} /> Сбросить к плану из Excel (8 недель)
          </button>
        </div>

        {/* Export */}
        <div className="mb-6">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} /> Скачать текущий план (.json)
          </button>
        </div>

        {/* Schema Documentation Prompt */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button 
            className="flex justify-between items-center w-full font-bold text-secondary" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => setShowSpec(!showSpec)}
          >
            <span>{showSpec ? '▼ Скрыть структуру JSON' : '► Показать структуру и промпт JSON'}</span>
          </button>

          {showSpec && (
            <div className="mt-4">
              <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
                Промпт для ИИ / формат шаблона:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ 
                  backgroundColor: '#111', 
                  border: '1px solid #333', 
                  padding: '0.75rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  color: '#fff'
                }}>
                  {SAMPLE_JSON_SCHEMA}
                </pre>
                <button 
                  className="icon-btn" 
                  style={{ position: 'absolute', top: '5px', right: '5px', padding: '4px' }}
                  onClick={handleCopySpec}
                  title="Копировать"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
