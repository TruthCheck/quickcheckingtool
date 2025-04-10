import React from 'react';

function LanguageSwitcher({ onLanguageChange }) {
  return (
    <select onChange={(e) => onLanguageChange(e.target.value)}>
      <option value="en">English</option>
      <option value="ig">Igbo</option>
      <option value="yo">Yoruba</option>
      <option value="ha">Hausa</option>
    </select>
  );
}

export default LanguageSwitcher;
