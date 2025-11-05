import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onSubmit, onToggleMode }: AuthFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, ...(mode === 'register' && { name }) });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'login' ? t('login') : t('register')}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Ingresa tus credenciales para continuar'
            : 'Crea una cuenta para comenzar'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>
          <Button type="submit" className="w-full" data-testid="button-submit">
            {mode === 'login' ? t('login') : t('register')}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            onClick={onToggleMode}
            className="text-primary hover:underline"
            data-testid="button-toggle-mode"
          >
            {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
