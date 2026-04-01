// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { filterRecords, getCurrentUser, updateRecord } from '@/lib/supabase-helpers';
import { translations } from './translations';

const defaultT = (key: string) => key;
const defaultContext = { language: 'en', changeLanguage: async () => {}, t: defaultT, isLoading: false };
const LanguageContext = createContext(defaultContext);

export const useLanguage = () => {
  return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profiles = await filterRecords('user_profiles', { user_id: user.id });
          if (profiles.length > 0 && profiles[0].preferred_language) {
            setLanguage(profiles[0].preferred_language);
          }
        }
      } catch (e) {
        // Not logged in, use default
        console.error('Failed to load language preference:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    try {
      const user = await getCurrentUser();
      if (user) {
        const profiles = await filterRecords('user_profiles', { user_id: user.id });
        if (profiles.length > 0) {
          await updateRecord('user_profiles', profiles[0].id, {
            preferred_language: newLanguage
          });
        }
      }
    } catch (e) {
      // Not logged in, just update state
      console.error('Failed to update language preference:', e);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};