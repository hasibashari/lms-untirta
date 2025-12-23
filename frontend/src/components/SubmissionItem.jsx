import { useState } from 'react';

export default function SubmissionItem({ submission, onGrade }) {
  const [grade, setGrade] = useState(submission.grade ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onGrade(submission.id, grade, feedback);
    setSaving(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-2">
      <div className="flex justify-between">
        <div>
          <p className="font-semibold">
            {submission.student.name}
          </p>
          <p className="text-sm text-gray-600">
            {submission.student.email}
          </p>
        </div>

        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Lihat File
        </a>
      </div>

      <p className="text-xs text-gray-500">
        Dikumpulkan:{' '}
        {new Date(submission.submittedAt).toLocaleString()}
      </p>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Nilai"
          value={grade}
          onChange={e => setGrade(e.target.value)}
          className="border p-2 w-24 rounded"
        />

        <input
          type="text"
          placeholder="Feedback"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="border p-2 flex-1 rounded"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-3 rounded disabled:opacity-50"
        >
          {saving ? '...' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}
