import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  HospitalIcon,
  InfoIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  StethoscopeIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { Logo } from '../../components/navigation/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { mockLogin, type MockLoginRole } from '../../api/auth';
import { heroImage } from '../../data/siteContent';
import { cn } from '../../utils/cn';

type RoleOption = {
  icon: typeof UserIcon;
  key: 'patient' | 'doctor' | 'specialist' | 'healthWorker' | 'phc' | 'admin';
  role: MockLoginRole;
  to: string;
  doctorVariant?: 'PRIMARY' | 'SECONDARY';
};

const roles: RoleOption[] = [
  { icon: UserIcon, key: 'patient', role: 'PATIENT', to: '/patient' },
  { icon: StethoscopeIcon, key: 'doctor', role: 'DOCTOR', to: '/doctor' },
  { icon: StethoscopeIcon, key: 'specialist', role: 'DOCTOR', to: '/doctor', doctorVariant: 'SECONDARY' },
  { icon: UsersIcon, key: 'healthWorker', role: 'HEALTH_WORKER', to: '/worker' },
  { icon: HospitalIcon, key: 'phc', role: 'PHC', to: '/phc' },
  { icon: ShieldCheckIcon, key: 'admin', role: 'ADMIN', to: '/admin' },
];

type Step = 'splash' | 'language' | 'role' | 'login';

const trustPoints = [
  'Your health information is protected by consent.',
  'Only authorized healthcare professionals can view relevant information.',
  'Access is controlled by your consent, not by default.',
];

export function Login() {
  const [step, setStep] = useState<Step>('splash');
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const { language, setLanguage, languages, t } = useLanguage();
  const { refresh: refreshAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'splash') {
      const timeout = window.setTimeout(() => setStep('language'), 1200);
      return () => window.clearTimeout(timeout);
    }
  }, [step]);

  const goToLogin = (role: RoleOption) => {
    setSelectedRole(role);
    setLoginError('');
    setStep('login');
  };

  const signIn = async () => {
    if (!selectedRole) return;
    setLoginError('');
    setBusy(true);
    try {
      await mockLogin({ role: selectedRole.role, doctorVariant: selectedRole.doctorVariant });
      await refreshAuth();
      navigate(selectedRole.to);
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Is the backend running on port 8000?';
      setLoginError(detail);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[1120px] px-3 py-6 sm:px-6 sm:py-10">
      {/* ===================== Left branding panel ===================== */}
      <aside className="relative hidden overflow-hidden rounded-3xl border border-line bg-[#eaf1fe] lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-10">
        <div>
          <Logo to="" size="lg" />
          <h1 className="mt-8 max-w-sm text-3xl font-bold leading-tight tracking-[-0.02em] text-navy">
            Connected healthcare access for rural and underserved communities.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink-500">
            From finding care to follow-up, Swasthya Sathi keeps the healthcare
            journey connected.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line shadow-pop">
          <img
            src={heroImage}
            alt="Rural healthcare in India — a health worker and doctor supporting a community"
            className="h-44 w-full object-cover"
          />
        </div>

        <ul className="space-y-2.5">
          {trustPoints.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-xs leading-5 text-ink-500">
              <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-health" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </aside>

      {/* ======================= Right login card ====================== */}
      <main className="flex w-full items-center justify-center lg:w-[54%]">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden">
            <Logo to="/" size="md" className="justify-center" />
          </div>

          <div className="mt-4 rounded-[24px] border border-line bg-white p-5 shadow-card sm:p-6 lg:mt-0">
            {step === 'splash' && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint text-brand">
                  <ShieldCheckIcon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="mt-6 text-xl font-semibold text-navy">{t('app.name')}</h1>
                <p className="mt-2 text-sm text-ink-500">{t('app.tagline')}</p>
                <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full w-2/3 rounded-full bg-brand" />
                </div>
                <p className="sr-only">Loading Swasthya Sathi…</p>
              </div>
            )}

            {step === 'language' && (
              <div className="mt-2">
                <h1 className="text-xl font-semibold text-navy">{t('login.chooseLanguage')}</h1>
                <p className="mt-1 text-sm text-ink-500">{t('login.chooseLanguageHint')}</p>
                <div className="mt-5 grid gap-2">
                  {languages.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setLanguage(option.code);
                        setStep('role');
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors',
                        language === option.code
                          ? 'border-brand/40 bg-brand-tint text-brand'
                          : 'border-line bg-white text-navy hover:border-brand/30 hover:bg-brand-tint2'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-line-soft">
                          <GlobeIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="block text-xs text-ink-500">{option.nativeLabel}</span>
                        </span>
                      </span>
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'role' && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-navy">{t('login.roleTitle')}</h1>
                    <p className="mt-1 text-sm text-ink-500">{t('login.roleHint')}</p>
                  </div>
                  <span className="hidden rounded-full border border-line px-2.5 py-1 text-2xs font-semibold text-ink-400 sm:block">
                    Demo roles
                  </span>
                </div>
                <div className="mt-5 space-y-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.key}
                        type="button"
                        onClick={() => goToLogin(role)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-left transition-colors hover:border-brand/30 hover:bg-brand-tint2"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-navy">{t(`roles.${role.key}`)}</span>
                          <span className="block truncate text-xs text-ink-500">{t(`roleDetail.${role.key}`)}</span>
                        </span>
                        <ArrowRightIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-start gap-1.5 text-2xs leading-4 text-ink-400">
                  <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Demo role selection never grants permissions — the backend validates
                  the actual user role.
                </p>
              </div>
            )}

            {step === 'login' && selectedRole && (
              <>
                <div className="mt-0 flex items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand-tint px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                      {(() => {
                        const Icon = selectedRole.icon;
                        return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
                      })()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-navy">{t('login.signingInAs')}</span>
                      <span className="block truncate text-2xs text-ink-500">
                        {t(`roles.${selectedRole.key}`)} · Demo data — not real patient information
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('role');
                      setLoginError('');
                    }}
                    className="shrink-0 text-xs font-medium text-brand hover:text-brand-dark"
                  >
                    {t('login.change')}
                  </button>
                </div>

                <form
                  className="mt-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    signIn();
                  }}
                >
                  <h1 className="text-xl font-semibold text-navy">{t('login.welcomeBack')}</h1>
                  <p className="mt-1 text-sm text-ink-500">{t('login.signInMessage')}</p>

                  {loginError && (
                    <p role="alert" className="mt-3 rounded-card border border-error/30 bg-error-tint px-3 py-2 text-xs leading-5 text-error">
                      {loginError}
                    </p>
                  )}

                  <div className="mt-5 space-y-3">
                    <Input
                      label={t('login.mobileOrEmail')}
                      name="identity"
                      value={identity}
                      onChange={(event) => setIdentity(event.target.value)}
                      placeholder="+91 or you@example.com"
                      icon={<SmartphoneIcon className="h-4 w-4" aria-hidden="true" />}
                      autoComplete="username"
                      required
                    />
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-2xs font-medium text-ink-500">
                        {t('login.password')}
                      </label>
                      <div className="relative">
                        <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            'h-11 w-full rounded-chip border border-line bg-white pl-9 pr-10 text-sm text-navy placeholder:text-ink-400',
                            'focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15'
                          )}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-navy"
                        >
                          {showPassword ? <EyeOffIcon className="h-4 w-4" aria-hidden="true" /> : <EyeIcon className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="text-xs font-medium text-brand hover:text-brand-dark"
                      >
                        {t('login.forgotPassword')}
                      </button>
                      <a
                        href="/login"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs font-medium text-ink-500 hover:text-navy"
                      >
                        {t('login.helpLink')}
                      </a>
                    </div>

                    <Button type="submit" fullWidth size="lg" disabled={busy}>
                      {busy ? t('login.signingIn') : t('login.loginButton')}
                      {!busy && <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />}
                    </Button>
                  </div>
                </form>

                <div className="my-4 flex items-center gap-3 text-2xs text-ink-400">
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  or
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => signIn()}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-chip border border-line bg-white px-4 py-3 text-xs font-semibold text-navy transition-colors hover:bg-surface-soft"
                  >
                    <MailIcon className="h-4 w-4 text-brand" aria-hidden="true" />
                    {t('login.demoSignIn')}
                  </button>
                  <button
                    type="button"
                    disabled
                    title={t('login.meriPehchaanNote')}
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-chip border border-line bg-surface-soft px-4 py-3 text-xs font-medium text-ink-400"
                  >
                    <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                    {t('login.meriPehchaan')}
                  </button>
                  <p className="text-center text-2xs text-ink-400">{t('login.meriPehchaanNote')}</p>
                </div>

                <p className="mt-4 text-center text-xs text-ink-500">
                  {t('login.noAccount')}{' '}
                  <a
                    href="/login"
                    onClick={(e) => e.preventDefault()}
                    className="font-semibold text-brand hover:text-brand-dark"
                  >
                    {t('login.createAccount')}
                  </a>
                </p>
              </>
            )}

            <p className="mt-5 border-t border-line-soft pt-4 text-center text-[11px] leading-5 text-ink-400">
              {t('login.demoFooter')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}