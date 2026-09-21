import { useEffect, useState } from 'react';
import type { TransformationPlan } from '../../core/planner/types';
import './App.css';

interface Options {
  enabled: boolean;
  plans: TransformationPlan[];
  maxFileSize: number;
  autoProcess: boolean;
}

const DEFAULT_OPTIONS: Options = {
  enabled: true,
  plans: [],
  maxFileSize: 50 * 1024 * 1024,
  autoProcess: true,
};

function App() {
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [status, setStatus] = useState<'loading' | 'saved' | 'error'>('loading');

  useEffect(() => {
    browser.storage.sync.get('options').then((result) => {
      if (result.options) {
        setOptions({ ...DEFAULT_OPTIONS, ...result.options });
      }
      setStatus('saved');
    });
  }, []);

  const handleSave = () => {
    setStatus('loading');
    browser.storage.sync.set({ options }).then(() => {
      setStatus('saved');
      setTimeout(() => setStatus('saved'), 2000);
    });
  };

  const handlePlanChange = (index: number, field: keyof TransformationPlan, value: TransformationPlan[keyof TransformationPlan]) => {
    const newPlans = [...options.plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setOptions({ ...options, plans: newPlans });
  };

  const addPlan = () => {
    setOptions({
      ...options,
      plans: [...options.plans, { convertTo: 'jpeg', resize: { width: 1920, height: 1080 }, compress: { maxBytes: 5000000 } }],
    });
  };

  const removePlan = (index: number) => {
    setOptions({
      ...options,
      plans: options.plans.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="options-container">
      <header>
        <h1>FileThrough Options</h1>
      </header>

      <section className="section">
        <h2>General</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.enabled}
            onChange={(e) => setOptions({ ...options, enabled: e.target.checked })}
          />
          <span>Enable automatic file processing</span>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={options.autoProcess}
            onChange={(e) => setOptions({ ...options, autoProcess: e.target.checked })}
          />
          <span>Auto-process files on upload pages</span>
        </label>

        <div className="field">
          <label htmlFor="maxFileSize">Max file size (MB)</label>
          <input
            id="maxFileSize"
            type="number"
            min="1"
            max="500"
            value={options.maxFileSize / (1024 * 1024)}
            onChange={(e) => setOptions({ ...options, maxFileSize: Number(e.target.value) * 1024 * 1024 })}
          />
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Transformation Rules</h2>
          <button className="btn btn-primary" onClick={addPlan}>Add Plan</button>
        </div>

        {options.plans.length === 0 && (
          <p className="empty-state">No transformation plans defined. Files will be processed with default settings.</p>
        )}

        {options.plans.map((plan, index) => (
          <div key={index} className="rule-card">
            <div className="rule-header">
              <span>Plan #{index + 1}</span>
              <button className="btn btn-danger btn-sm" onClick={() => removePlan(index)}>Remove</button>
            </div>
            <div className="rule-fields">
              {plan.convertTo && (
                <div className="field">
                  <label>Convert To</label>
                  <select
                    value={plan.convertTo}
                    onChange={(e) => handlePlanChange(index, 'convertTo', e.target.value as TransformationPlan['convertTo'])}
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              )}

              {plan.resize && (
                <div className="field">
                  <label>Resize Width</label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    value={plan.resize.width}
                    onChange={(e) => handlePlanChange(index, 'resize', { ...plan.resize!, width: Number(e.target.value) })}
                  />
                </div>
              )}

              {plan.resize && (
                <div className="field">
                  <label>Resize Height</label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    value={plan.resize.height}
                    onChange={(e) => handlePlanChange(index, 'resize', { ...plan.resize!, height: Number(e.target.value) })}
                  />
                </div>
              )}

              {plan.compress && (
                <div className="field">
                  <label>Max Bytes</label>
                  <input
                    type="number"
                    min="1000"
                    max="100000000"
                    value={plan.compress.maxBytes || 0}
                    onChange={(e) => handlePlanChange(index, 'compress', { ...plan.compress!, maxBytes: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <footer className="footer">
        <div className={`status ${status}`}>
          {status === 'loading' && 'Saving...'}
          {status === 'saved' && 'Settings saved'}
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={status === 'loading'}>
          Save Settings
        </button>
      </footer>
    </div>
  );
}

export default App;