import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const Donate = () => {
  const { projectId } = useParams();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:8000/api/donations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: projectId,
          amount: amount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess(true);
      setAmount('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Donate to Project</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Donating...' : 'Donate'}
        </button>
      </form>
      {error && <div>Error: {error}</div>}
      {success && <div>Donation successful!</div>}
    </div>
  );
};

export default Donate; 