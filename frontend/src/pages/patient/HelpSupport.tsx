import { useState } from 'react';
import { ChevronDownIcon, HelpCircleIcon, PhoneCallIcon, MessageSquareIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/cn';

const faqs = [
  {
    question: 'How do I find a doctor near me?',
    answer:
      'Use "Find Services" in your patient workspace to search doctors, PHCs and hospitals. Results include distance, consultation modes and verified credentials.',
  },
  {
    question: 'How do I book an appointment?',
    answer:
      'Open a doctor profile and choose a free slot from the availability calendar, then select an in-person or online consultation and confirm.',
  },
  {
    question: 'What happens after a referral?',
    answer:
      'Your referral appears under "Referrals". Once the receiving doctor accepts it, you will get a notification and can book the follow-up visit.',
  },
  {
    question: 'Is my health data secure?',
    answer:
      'Yes. Data is encrypted in transit and at rest, messages use end-to-end encryption, and any sharing with your care network is consent-based.',
  },
  {
    question: 'How does symptom guidance work?',
    answer:
      '"Ask a Health Worker" walks you through your symptoms step by step and shares care guidance with a suggested next action. It never replaces a doctor and always recommends contacting care in emergencies.',
  },
  {
    question: 'Can I get care in my local language?',
    answer:
      'Yes. Change the app language in "Profile Settings". Consultations and messages support Hindi and other regional languages.',
  },
];

const contacts = [
  { label: 'Emergency Helpline', value: '108', icon: PhoneCallIcon, tone: 'bg-red-50 text-red-600' },
  { label: 'Health Helpline', value: '104', icon: PhoneCallIcon, tone: 'bg-sky-50 text-sky-700' },
  { label: 'Support Centre', value: 'Grievance desk', icon: HelpCircleIcon, tone: 'bg-emerald-50 text-emerald-700' },
];

export function HelpSupport() {
  const [open, setOpen] = useState<string | null>(faqs[0].question);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Help & Support</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Guides and assistance for using Swasthya Sathi.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Frequently asked questions" subtitle="Common questions from patients.">
          <div className="divide-y divide-line-soft">
            {faqs.map((faq) => {
              const isOpen = open === faq.question;
              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : faq.question)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
                  >
                    <span className="text-xs font-medium text-navy">{faq.question}</span>
                    <ChevronDownIcon
                      className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform', isOpen && 'rotate-180')}
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-3 text-2xs leading-5 text-ink-500">{faq.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Get in touch" subtitle="Reach the right team.">
            <div className="space-y-2">
              {contacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <div key={contact.label} className="flex items-center gap-2.5 rounded-card border border-line px-3 py-2.5">
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', contact.tone)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xs text-ink-500">{contact.label}</p>
                      <p className="truncate text-xs font-semibold text-navy">{contact.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Still stuck?" subtitle="Talk to our support team.">
            <div className="space-y-2">
              <Button variant="secondary" to="/patient/messages" fullWidth>
                <MessageSquareIcon className="h-3.5 w-3.5" />
                Message support
              </Button>
              <Button variant="secondary" to="/contact" fullWidth>
                <PhoneCallIcon className="h-3.5 w-3.5" />
                Contact us
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}