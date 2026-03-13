// @ts-nocheck
import React from 'react';

interface CountryFlagProps {
  country: string;
  size?: number;
  className?: string;
}

const countryToCode: Record<string, string> = {
  'Nigeria': 'NG', 'Ghana': 'GH', 'Kenya': 'KE', 'South Africa': 'ZA',
  'Ethiopia': 'ET', 'Tanzania': 'TZ', 'Uganda': 'UG', 'Cameroon': 'CM',
  'Senegal': 'SN', 'United States': 'US', 'United Kingdom': 'GB',
  'Canada': 'CA', 'France': 'FR', 'Germany': 'DE', 'Brazil': 'BR',
};

const CountryFlag: React.FC<CountryFlagProps> = ({ country, size = 20, className = '' }) => {
  const code = countryToCode[country] || '';
  if (!code) return <span className={className}>🌍</span>;
  
  const flagUrl = `https://flagcdn.com/w${size * 2}/${code.toLowerCase()}.png`;
  return <img src={flagUrl} alt={country} width={size} height={size} className={className} />;
};

export default CountryFlag;
