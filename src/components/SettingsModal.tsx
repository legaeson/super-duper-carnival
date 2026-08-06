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

export function SettingsModal({ onClose }: Props) {
  const { plan, setPlan, resetToDefaultPlan, unit, setUnit, theme, setTheme } = useWorkout();
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Настройки</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="recommendation-banner mb-6">
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* Theme Setting */}
        <div className="mb-6">
          <label className="text-secondary mb-2 block font-semibold" style={{ fontSize: '0.875rem' }}>Тема оформления</label>
          <div className="segmented-control">
            <button 
              className={`segmented-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              Светлая (серая)
            </button>
            <button 
              className={`segmented-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Тёмная
            </button>
          </div>
        </div>

        {/* Unit Setting */}
        <div className="mb-6">
          <label className="text-secondary mb-2 block font-semibold" style={{ fontSize: '0.875rem' }}>Единица измерения веса</label>
          <div className="segmented-control">
            <button 
              className={`segmented-btn ${unit === 'kg' ? 'active' : ''}`}
              onClick={() => setUnit('kg')}
            >
              Килограммы (кг)
            </button>
            <button 
              className={`segmented-btn ${unit === 'lbs' ? 'active' : ''}`}
              onClick={() => setUnit('lbs')}
            >
              Фунты (lbs)
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }} className="mb-6">
          <h4 className="font-bold text-primary mb-3" style={{ fontSize: '1rem' }}>Управление планом (JSON)</h4>

          {/* Upload File */}
          <div className="mb-3">
            <label className="btn btn-secondary w-full" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Загрузить .json файл
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Textarea Import */}
          <div className="mb-3">
            <textarea
              className="input mb-2"
              rows={4}
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
          <div className="mb-3">
            <button className="btn btn-secondary" onClick={() => { resetToDefaultPlan(); onClose(); }}>
              <RefreshCw size={16} /> Сбросить к плану из Excel (8 недель)
            </button>
          </div>

          {/* Export */}
          <div>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} /> Скачать текущий план (.json)
            </button>
          </div>
        </div>

        {/* Schema Documentation Prompt */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <button 
            className="flex justify-between items-center w-full font-semibold text-secondary" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }}
            onClick={() => setShowSpec(!showSpec)}
          >
            <span>{showSpec ? '▼ Скрыть структуру JSON' : '► Показать структуру и промпт JSON'}</span>
          </button>

          {showSpec && (
            <div className="mt-3">
              <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
                Формат шаблона для выгрузки/ИИ:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{ 
                  backgroundColor: 'var(--surface-color-light)', 
                  border: '1px solid var(--border-color)', 
                  padding: '0.875rem', 
                  borderRadius: 'var(--border-radius)', 
                  fontSize: '0.775rem',
                  overflowX: 'auto',
                  color: 'var(--text-primary)'
                }}>
                  {SAMPLE_JSON_SCHEMA}
                </pre>
                <button 
                  className="icon-btn" 
                  style={{ position: 'absolute', top: '6px', right: '6px', padding: '4px' }}
                  onClick={handleCopySpec}
                  title="Копировать"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
