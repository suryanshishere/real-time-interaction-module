'use client';
import { useState } from 'react';
import axios from 'axios';
import LiveChart from './LiveChart';
import Timer from './Timer';

export default function AdminPanel() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [poll, setPoll] = useState<any>(null);
  const [error, setError] = useState('');

  const create = async () => {
    setError('');
    if (!question.trim() || options.some(o => !o.trim())) {
      setError('Please fill in the question and all options.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:4000/api/poll/create', {
        question,
        options: options.filter(o => o.trim())
      });
      setPoll(res.data);
    } catch (err) {
      setError('Failed to create poll. Try again.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 p-4 bg-white shadow rounded-xl">
      <h1 className="text-2xl font-semibold">Create a Poll</h1>

      <input
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Enter your question"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {options.map((o, i) => (
        <input
          key={i}
          value={o}
          onChange={e => {
            const arr = [...options];
            arr[i] = e.target.value;
            setOptions(arr);
          }}
          placeholder={`Option ${i + 1}`}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ))}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <button
          onClick={() => setOptions([...options, ''])}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
        >
          ➕ Add Option
        </button>
        <button
          onClick={create}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          🚀 Create Poll
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 font-medium">{error}</div>
      )}

      {poll && (
        <div className="space-y-4 mt-6">
          <div className="text-green-700 font-semibold">
            ✅ Poll Created! <br />
            Session Code: <span className="font-mono text-lg">{poll.sessionCode}</span>
          </div>

          <LiveChart code={poll.sessionCode} options={poll.options} />
          <Timer />
        </div>
      )}
    </div>
  );
}
