import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Check, Copy, Mail, Phone, Send } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DemoNote, RuleHeading } from '@/components/ui/misc';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/disclosure';
import { cinemas, COMPANY, faq } from '@/data';
import { mailtoUrl, telUrl } from '@/lib/external';

const topics = [
  { id: 'booking', label: 'A booking', email: COMPANY.supportEmail },
  { id: 'access', label: 'Accessibility', email: COMPANY.accessibilityEmail },
  { id: 'lost', label: 'Lost property', email: COMPANY.supportEmail },
  { id: 'feedback', label: 'Feedback about a visit', email: COMPANY.supportEmail },
  { id: 'press', label: 'Press', email: COMPANY.pressEmail },
] as const;

const schema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name.').max(80),
  email: z.string().trim().email('That does not look like an email address.'),
  topic: z.string().min(1, 'Choose what this is about.'),
  cinemaId: z.string().optional(),
  message: z
    .string()
    .trim()
    .min(10, 'A sentence or two helps us answer properly.')
    .max(2000, 'Please keep it under 2,000 characters.'),
});

type ContactForm = z.infer<typeof schema>;

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [prepared, setPrepared] = useState<{ href: string; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<ContactForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', topic: 'booking', cinemaId: '', message: '' },
  });

  const topicId = watch('topic');
  const cinemaId = watch('cinemaId');

  function onSubmit(values: ContactForm) {
    const topic = topics.find((t) => t.id === values.topic) ?? topics[0];
    const cinema = cinemas.find((c) => c.id === values.cinemaId);
    const to = cinema && values.topic === 'lost' ? cinema.lostAndFound.email : topic.email;

    const body = [
      values.message,
      '',
      '—',
      `From: ${values.name} <${values.email}>`,
      `Subject area: ${topic.label}`,
      cinema ? `Cinema: ${cinema.name}` : null,
      '',
      'Sent from the Nokshi Cinemas demonstration site.',
    ]
      .filter((line): line is string => line !== null)
      .join('\n');

    setPrepared({
      href: mailtoUrl({ to, subject: `${topic.label} — ${values.name}`, body }),
      text: `To: ${to}\nSubject: ${topic.label} — ${values.name}\n\n${body}`,
    });
  }

  async function copyMessage() {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt('Copy your message', prepared.text);
    }
  }

  const generalFaq = faq.filter((entry) =>
    ['venue', 'access', 'arrival', 'food', 'lost-found', 'demo', 'tickets'].includes(entry.topic),
  );

  return (
    <div className="shell">
      <PageHeader
        eyebrow="Get in touch"
        title="Contact and support"
        lede="The quickest route is usually the house itself — each one answers its own phone. For anything else, the form below composes an email you send from your own mail app."
      />

      <div className="grid gap-12 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <section aria-labelledby="form-heading">
            <RuleHeading id="form-heading" className="mb-5">
              Send us a message
            </RuleHeading>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-5">
              <Field label="Your name" htmlFor="contact-name" error={errors.name?.message}>
                <Input
                  id="contact-name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
              </Field>

              <Field label="Email" htmlFor="contact-email" error={errors.email?.message}>
                <Input
                  id="contact-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </Field>

              <Field label="What is this about?" htmlFor="contact-topic" error={errors.topic?.message}>
                <Select value={topicId} onValueChange={(value) => setValue('topic', value)}>
                  <SelectTrigger id="contact-topic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Which cinema?"
                htmlFor="contact-cinema"
                optional
                hint="Lost property goes straight to that house's desk."
              >
                <Select
                  value={cinemaId || 'none'}
                  onValueChange={(value) => setValue('cinemaId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="contact-cinema">
                    <SelectValue placeholder="Not about a specific house" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not about a specific house</SelectItem>
                    {cinemas.map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        {cinema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Message" htmlFor="contact-message" error={errors.message?.message}>
                <Textarea
                  id="contact-message"
                  rows={6}
                  aria-invalid={Boolean(errors.message)}
                  {...register('message')}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="lg">
                  <Send aria-hidden="true" />
                  Prepare the email
                </Button>
                {isSubmitted && Object.keys(errors).length > 0 ? (
                  <p role="status" className="text-sm text-danger">
                    Please fix the fields above.
                  </p>
                ) : null}
              </div>

              <DemoNote>
                This site has no backend, so nothing can be submitted from here. The button composes
                the message and hands it to your own email app — you send it, and you can see exactly
                what goes.
              </DemoNote>
            </form>

            {prepared ? (
              <div
                role="status"
                className="mt-6 max-w-xl border-2 border-content bg-surface-raised p-5"
              >
                <h3 className="font-display text-xl leading-tight">Your message is ready</h3>
                <p className="mt-2 text-[0.9375rem] leading-7 text-content-muted">
                  Nothing has been sent yet. Open it in your mail app, or copy the text and send it
                  however you prefer.
                </p>
                <pre className="mt-4 max-h-56 overflow-auto border border-hairline bg-surface-sunken/60 p-3 text-[0.75rem] leading-5">
                  {prepared.text}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild>
                    <a href={prepared.href}>
                      <Mail aria-hidden="true" />
                      Open in mail app
                    </a>
                  </Button>
                  <Button variant="outline" onClick={copyMessage}>
                    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                    {copied ? 'Copied' : 'Copy text'}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="faq-heading" className="mt-14">
            <RuleHeading id="faq-heading" className="mb-3">
              Common questions
            </RuleHeading>
            <Accordion type="single" collapsible className="border-b border-hairline">
              {generalFaq.map((entry) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger>{entry.question}</AccordionTrigger>
                  <AccordionContent>
                    <p>{entry.answer}</p>
                    <p lang="bn" className="mt-3 text-content-faint">
                      {entry.answerBn}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="direct" className="border border-hairline-strong p-5">
            <h2 id="direct" className="eyebrow mb-4">
              Head office
            </h2>
            <p className="space-y-1 text-[0.9375rem] leading-7">
              <a
                href={telUrl(COMPANY.supportPhone)}
                className="inline-flex items-center gap-2 underline underline-offset-4"
              >
                <Phone aria-hidden="true" className="size-4" />
                {COMPANY.supportPhone}
              </a>
              <br />
              <a
                href={`mailto:${COMPANY.supportEmail}`}
                className="inline-flex items-center gap-2 break-all underline underline-offset-4"
              >
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                {COMPANY.supportEmail}
              </a>
            </p>
            <p className="numeral mt-2 text-[0.8125rem] text-content-muted">{COMPANY.supportHours}</p>
          </section>

          <section id="access" aria-labelledby="access-heading" className="scroll-mt-24 border border-hairline-strong p-5">
            <h2 id="access-heading" className="eyebrow mb-3">
              Accessibility
            </h2>
            <p className="text-[0.9375rem] leading-7 text-content-muted">
              For anything that needs arranging in advance — a companion ticket, a sensory-friendly
              screening, or help getting to your seat — contact the house directly or email the access
              team. This site cannot arrange it for you.
            </p>
            <a
              href={`mailto:${COMPANY.accessibilityEmail}`}
              className="mt-3 inline-block break-all text-[0.9375rem] font-semibold underline underline-offset-4"
            >
              {COMPANY.accessibilityEmail}
            </a>
          </section>

          <section id="lost" aria-labelledby="lost-heading" className="scroll-mt-24 border border-hairline-strong p-5">
            <h2 id="lost-heading" className="eyebrow mb-3">
              Lost property
            </h2>
            <p className="mb-4 text-[0.9375rem] leading-7 text-content-muted">
              Each house keeps its own found items and has its own desk. Max can assemble a report
              with your booking and seat already filled in — you send it yourself.
            </p>
            <ul className="space-y-3">
              {cinemas.map((cinema) => (
                <li key={cinema.id} className="border-t border-hairline pt-3">
                  <p className="font-semibold">{cinema.shortName}</p>
                  <p className="numeral text-[0.8125rem] text-content-muted">
                    Held {cinema.lostAndFound.holdingPeriodDays} days · {cinema.lostAndFound.hours}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.8125rem]">
                    <a
                      href={telUrl(cinema.lostAndFound.phone)}
                      className="underline underline-offset-4"
                    >
                      {cinema.lostAndFound.phone}
                    </a>
                    <a
                      href={`mailto:${cinema.lostAndFound.email}`}
                      className="break-all underline underline-offset-4"
                    >
                      {cinema.lostAndFound.email}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="houses-contact" className="border border-hairline-strong p-5">
            <h2 id="houses-contact" className="eyebrow mb-3">
              The houses
            </h2>
            <ul className="space-y-2">
              {cinemas.map((cinema) => (
                <li key={cinema.id}>
                  <Link
                    to={`/cinemas/${cinema.slug}`}
                    className="text-[0.9375rem] underline-offset-4 hover:underline"
                  >
                    {cinema.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <DemoNote className="mb-10" tone="loud">
        All contact details on this page are fictional addresses at the example.invalid-style domain
        used throughout this demonstration. Nothing sent to them will reach anyone.
      </DemoNote>
    </div>
  );
}
