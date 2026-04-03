// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('preferred_language')
            .eq('user_id', session.user.id)
            .limit(1);
          if (profiles?.[0]?.preferred_language) {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1);
        if (profiles?.[0]?.id) {
          await supabase
            .from('user_profiles')
            .update({ preferred_language: newLanguage })
            .eq('id', profiles[0].id);
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