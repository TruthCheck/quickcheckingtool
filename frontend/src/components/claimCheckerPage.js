import React, { useState } from 'react';

function ClaimCheckerPage() {
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would integrate the claim checking logic
    setResult('Result: Verified'); // Example result
  };

  return (
    <div>
      <h1>Claim Checker</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={claim} 
          onChange={(e) => setClaim(e.target.value)} 
          placeholder="Paste claim here" 
        />
        <button type="submit">Check Claim</button>
      </form>
      <p>{result}</p>
    </div>
  );
}

export default ClaimCheckerPage;
