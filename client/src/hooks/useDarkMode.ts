import { useState, useEffect } from 'react';

const getInitial = (): boolean => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useDarkMode = () => {
  const [dark, setDark] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Apply on first mount without waiting for state change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', getInitial() ? 'dark' : 'light');
  }, []);

  return { dark, toggle: () => setDark(d => !d) };
};
