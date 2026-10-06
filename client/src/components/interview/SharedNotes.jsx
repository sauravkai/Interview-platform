import React, { useEffect, useState } from 'react';
import { NotebookPen, Save } from 'lucide-react';

export const SharedNotes = ({ value = '', onChange = () => {}, onSave = () => {} }) => {
  const [notes, setNotes] = useState(
    value ||
      "Interviewer Evaluation Scratchpad:\n- Candidate explained time complexity (O(N) time, O(N) space).\n- Handled null input edge cases cleanly.\n- Strong verbal reasoning."
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(value || '');
  }, [value]);

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setNotes(nextValue);
    onChange(nextValue);
  };

  const handleSave = () => {
    setSaved(true);
    onSave(notes);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <NotebookPen className="w-3.5 h-3.5 text-purple-400" /> Evaluation Notes
        </span>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-purple-300 transition-colors"
        >
          <Save className="w-3 h-3" /> {saved ? 'Saved!' : 'Save Notes'}
        </button>
      </div>

      <textarea
        value={notes}
        onChange={handleChange}
        className="w-full h-full min-h-[140px] bg-slate-950 p-3 text-xs text-slate-300 font-mono focus:outline-none resize-none"
        placeholder="Type interviewer notes here..."
      />
    </div>
  );
};
