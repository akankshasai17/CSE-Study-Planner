'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Award, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  CheckCircle2,
  Trash
} from 'lucide-react';

export default function CGPACalculator() {
  const [cgpaData, setCgpaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    semester: '',
    sgpa: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCgpaData = async () => {
    try {
      const res = await fetch('/api/cgpa');
      if (!res.ok) throw new Error('Failed to load CGPA records.');
      const data = await res.json();
      setCgpaData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCgpaData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const sem = parseInt(formData.semester);
    const sg = parseFloat(formData.sgpa);

    if (isNaN(sem) || sem < 1 || sem > 10) {
      setError('Semester must be an integer between 1 and 10.');
      setSubmitting(false);
      return;
    }

    if (isNaN(sg) || sg < 0.0 || sg > 10.0) {
      setError('SGPA must be a decimal value between 0.0 and 10.0.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/cgpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: sem,
          sgpa: sg
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record SGPA.');
      }

      setFormData({ semester: '', sgpa: '' });
      fetchCgpaData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRecord = async (recordId) => {
    if (!confirm('Remove this semester SGPA?')) return;
    try {
      const res = await fetch(`/api/cgpa/${recordId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCgpaData();
      }
    } catch (err) {
      console.error('Error deleting SGPA record:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-secondary rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-secondary rounded-2xl md:col-span-2"></div>
          <div className="h-44 bg-secondary rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Percentage equivalent helper (often SGPA * 9.5 or (CGPA - 0.75) * 10 or simply CGPA * 10 depending on university)
  // Let's display a standard percentage estimation: CGPA * 9.5
  const estimatedPercentage = cgpaData.cgpa > 0 ? roundToTwo(cgpaData.cgpa * 9.5) : 0;

  function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
  }

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">CGPA Calculator</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Record semester-wise SGPA and calculate overall CGPA status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Giant CGPA Display & Form */}
        <div className="space-y-6">
          
          {/* Circular CGPA Gauge Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Visual background pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 -mr-8 -mt-8 pointer-events-none"></div>
            
            <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Overall Score</h3>

            {/* Radial progress representation */}
            <div className="relative flex items-center justify-center h-36 w-36 mb-4">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-secondary"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - cgpaData.cgpa / 10.0)}
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-black">{cgpaData.cgpa}</span>
                <span className="block text-[10px] text-muted-foreground font-bold mt-0.5">OUT OF 10.0</span>
              </div>
            </div>

            {cgpaData.cgpa > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Estimated Percentage</p>
                <p className="text-sm font-black text-primary">{estimatedPercentage}%</p>
                <p className="text-[9px] text-muted-foreground">(Formula: CGPA × 9.5)</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Log semesters to calculate average</p>
            )}
          </div>

          {/* Log SGPA Form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm mb-4">Add Semester SGPA</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Semester Number
                </label>
                <input
                  type="number"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="10"
                  placeholder="E.g., 1, 2, 3..."
                  className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  SGPA Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="sgpa"
                  value={formData.sgpa}
                  onChange={handleInputChange}
                  required
                  min="0.0"
                  max="10.0"
                  placeholder="E.g., 9.25"
                  className="w-full bg-secondary border border-border focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold hover:bg-opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                {submitting ? 'Saving...' : 'Add Record'}
              </button>
            </form>
          </div>

        </div>

        {/* Semester cards list */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[525px]">
          <div className="mb-4">
            <h2 className="font-bold text-base">Academic Record</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Semester-wise results history</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-4 h-max content-start">
            {cgpaData.records.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-muted/60 mb-2" />
                <p className="text-sm font-semibold">No records added yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Use the form on the left to add your first semester SGPA!</p>
              </div>
            ) : (
              cgpaData.records.map((record) => (
                <div 
                  key={record.id}
                  className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex justify-between items-center hover:border-primary/30 transition-all"
                >
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Semester</span>
                    <span className="text-lg font-black text-foreground">Sem {record.semester}</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                        SGPA: {record.sgpa}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
                    title="Delete record"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
