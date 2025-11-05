import { useState } from 'react';
import AuthForm from '../AuthForm';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lib/i18n';

export default function AuthFormExample() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AuthForm
          mode={mode}
          onSubmit={(data) => console.log('Auth submitted:', data)}
          onToggleMode={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
      </div>
    </I18nextProvider>
  );
}
