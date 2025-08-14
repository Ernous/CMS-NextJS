'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteIcon: string;
  siteLogo: string;
  primaryColor: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxCommentsPerPost: number;
  maxReactionsPerPost: number;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'CMS Блог',
    siteDescription: 'Современная CMS система для блогов',
    siteIcon: '/favicon.ico',
    siteLogo: '',
    primaryColor: '#3B82F6',
    allowRegistration: true,
    requireEmailVerification: false,
    maxCommentsPerPost: 100,
    maxReactionsPerPost: 50
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}