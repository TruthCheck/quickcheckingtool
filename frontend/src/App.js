import React, { useState } from 'react';

//import ClaimCheckerPage from './components/claimCheckerPage';
import ResultDisplay from './components/resultDisplayPage';
//import LanguageSwitcher from './components/languageSwitcher';
import './styles.css';  


function App() {
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState('');

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  return (
    <div>
     
      <ResultDisplay result={result} />
    </div>
  );
}

export default App;
