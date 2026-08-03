/**
 * Links out of the application.
 *
 * Directions open a plain map search in whatever the customer's device uses.
 * No mapping SDK is loaded, no key is needed, and nothing about the customer
 * is sent anywhere by this app.
 */
export function mapUrl(query: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function mailtoUrl(input: { to: string; subject: string; body: string }): string {
  const params = new URLSearchParams({ subject: input.subject, body: input.body });
  // URLSearchParams encodes spaces as "+", which mail clients render literally.
  return `mailto:${input.to}?${params.toString().replace(/\+/g, '%20')}`;
}

/**
 * Builds an .ics calendar file in the browser and hands it back as a blob URL.
 * Nothing is uploaded; the file is generated from local data only.
 */
export function buildIcs(event: {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes: number;
}): string {
  const stamp = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
      date.getUTCDate(),
    ).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}${String(
      date.getUTCMinutes(),
    ).padStart(2, '0')}00Z`;

  const end = new Date(event.start.getTime() + event.durationMinutes * 60_000);

  // Long lines must be folded at 75 octets per RFC 5545: continuation lines
  // begin with a single space, which the parser strips back out.
  const fold = (line: string): string => {
    if (line.length <= 74) return line;
    const chunks: string[] = [line.slice(0, 74)];
    let rest = line.slice(74);
    while (rest.length > 73) {
      chunks.push(rest.slice(0, 73));
      rest = rest.slice(73);
    }
    if (rest) chunks.push(rest);
    return chunks.join('\r\n ');
  };

  const escape = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GrandPlex//Demonstration Build//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@grandplexcinemas.example`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(end)}`,
    fold(`SUMMARY:${escape(event.title)}`),
    fold(`DESCRIPTION:${escape(event.description)}`),
    fold(`LOCATION:${escape(event.location)}`),
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Leave for the cinema',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/** Triggers a download of a blob URL, then releases it. */
export function downloadUrl(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
