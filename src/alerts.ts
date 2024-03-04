import twilio from 'twilio';
import env from './env';

// https://pushover.net/api
export async function sendPushoverAlert({
  message,
  url,
  url_title,
}: {
  message: string;
  url?: string;
  url_title?: string;
}) {
  if (env.NODE_ENV === 'development') {
    console.log('Skipping push alert in development');
    return;
  }

  const formData = new FormData();

  formData.append('token', env.PUSHOVER_TOKEN);
  formData.append('user', env.PUSHOVER_USER);
  formData.append('message', message);
  formData.append('title', 'Ticket Alerts');
  if (url) formData.append('url', url);
  if (url_title) formData.append('url_title', url_title);

  // send push alert with Pushover
  return fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: formData,
  }).then((res) => res.json());
}

// note: does not work; needs updated to use the consts
export async function sendTwilioAlert({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_FROM_NUMBER
  ) {
    console.error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
    return;
  }

  try {
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      to,
      from: env.TWILIO_FROM_NUMBER,
    });

    // LAST_TEXT_SENT_AT = Date.now();
  } catch (error) {
    console.error(`Error sending message to ${to}: ${error}`);
    // ERROR = true;
  }
}

export async function sendPushAlert({
  to,
  mode,
  message,
}: {
  mode: 'sms' | 'pushover';
  message: string;
  to: string;
}) {
  switch (mode) {
    case 'sms':
      return sendTwilioAlert({ to, message });
    case 'pushover':
      return sendPushoverAlert({ message });
  }
}
