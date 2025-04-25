import { render, screen } from '@testing-library/react';
import { LanguageContext } from '../contexts/LanguageContext';
import T from '../components/T';
import { describe, it, expect } from 'vitest';

describe('T component', () => {
  it('renders translated text if child is string', () => {
    render(
      <LanguageContext.Provider value={{ language: 'en' }}>
        <T>login</T>
      </LanguageContext.Provider>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders child directly if not string', () => {
    render(
      <LanguageContext.Provider value={{ language: 'en' }}>
        <T><span>Custom Element</span></T>
      </LanguageContext.Provider>
    );
    expect(screen.getByText('Custom Element')).toBeInTheDocument();
  });
});
