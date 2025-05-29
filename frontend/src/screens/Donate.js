import axios from 'axios';
import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate

const Donate = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); // Added this hook
  const query = new URLSearchParams(location.search);
  
  const effectiveProjectId =
    projectId ||
    location.state?.projectId ||
    query.get('projectId') ||
    '';

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

// ...existing code...

const handleSubmit = async (event) => {
  event.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  if (!effectiveProjectId || isNaN(Number(effectiveProjectId))) {
    setError('No valid project selected for donation.');
    setLoading(false);
    return;
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
    setError('Please enter a valid donation amount (minimum 1).');
    setLoading(false);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    await axios.post(
      `http://localhost:8000/api/projects/${effectiveProjectId}/donate/`,
      { montant: parseFloat(amount) },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    setSuccess(true);
    setAmount('');
    setTimeout(() => {
      navigate(`/projects/${effectiveProjectId}`);
    }, 1500);

  } catch (error) {
    setError('Erreur lors du don');
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
            min={1}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Donate'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {success && (
        <div className="success">
          Thank you for your donation!
          {/* Consider adding a link back to the project */}
        </div>
      )}
    </div>
  );
};

export default Donate;