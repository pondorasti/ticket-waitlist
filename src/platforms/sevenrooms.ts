import z from 'zod';
import { sendPushAlert } from '../alerts';

/**
 * Configure these values to your liking.
 */
const VENUE_CODE = 'gordonramsayhellskitchendcwharf';
const VENUE_NAME = "Gordon Ramsay Hell's Kitchen DC (Wharf)";
const DATE_STR = '09-02-2023';
const TIME_SLOT = '19:00';
const PARTY_SIZE = 2;
const HALO_SIZE_HRS = 2; // check +/- on either side of TIME_SLOT
const BOOKING_URL =
  'https://www.gordonramsayrestaurants.com/en/us/hells-kitchen/locations/washington-dc';

// wait until getting this many consecutive errors before creating an error state
const MIN_ERROR_COUNT = 4;

// Don't send more than one text every const TEXT_MAX_FREQUENCY_MINS mins.
const TEXT_MAX_FREQUENCY_MINS = 30;

/**
 * You probably don't need to change anything below this line.
 */

// convert DATE_STR into YYYY-MM-DD
const [month, day, year] = DATE_STR.split('-');
const RES_DATE_STR = `${year}-${month}-${day}`;

const dateObj = new Date(`${RES_DATE_STR}T00:00:00`);

// https://www.sevenrooms.com/api-yoa/availability/widget/range?venue=gordonramsayhellskitchendcwharf&time_slot=19:00&party_size=2&halo_size_interval=24&start_date=09-02-2023&num_days=1&channel=SEVENROOMS_WIDGET&selected_lang_code=en
export const inputSchema = z.object({
  venue: z.string(),
  time_slot: z.string(),
  party_size: z.string(),
  halo_size_interval: z.string(),
  start_date: z.string(),
  num_days: z.string(),
  channel: z.string(),
  selected_lang_code: z.string(),
});

const timeSchema = z.object({
  time: z.string(),
  time_iso: z.string(),
  type: z.enum(['request', 'book']),
});

type Time = z.infer<typeof timeSchema>;

export const outputSchema = z.object({
  status: z.number(),
  data: z.object({
    availability: z.record(
      z.string(),
      z.array(
        z.object({
          name: z.string(),
          shift_persistent_id: z.string(),
          shift_id: z.string(),
          shift_category: z.string(),
          is_closed: z.boolean(),
          upsell_categories: z.array(z.unknown()),
          times: z.array(timeSchema),
          is_blackout: z.boolean(),
        })
      )
    ),
  }),
  csrftoken: z.null(),
});

const query: z.infer<typeof inputSchema> = {
  venue: VENUE_CODE,
  time_slot: TIME_SLOT,
  party_size: String(PARTY_SIZE),
  halo_size_interval: String(HALO_SIZE_HRS * 4), // 15-minute increments
  start_date: DATE_STR,
  num_days: '1',
  channel: 'SEVENROOMS_WIDGET',
  selected_lang_code: 'en',
};

let AVAILABLE_TIMES: Time[] = [];
let LAST_TEXT_SENT_AT = 0;
let ERROR_COUNT = 0;
let ERROR = false;
let STATUS_MESSAGE = 'NO_SEATS';

export function getStatusMessage() {
  return ERROR ? 'ERROR' : STATUS_MESSAGE;
}

export async function check() {
  AVAILABLE_TIMES = [];
  STATUS_MESSAGE = 'NO_SEATS';
  ERROR = false;

  const response = await fetch(
    `https://www.sevenrooms.com/api-yoa/availability/widget/range?${new URLSearchParams(
      query
    )}`
  ).then((res) => res.json());

  // console.log('data', JSON.stringify(response, null, 2));

  try {
    const res = outputSchema.safeParse(response);

    if (!res.success) {
      console.log('error parsing response');
      return;
    }

    const data = res.data;

    if (!(RES_DATE_STR in data.data.availability)) {
      console.log('date not found in response');
      return;
    }

    const results = data.data.availability[RES_DATE_STR];

    for (const r of results) {
      if (r.name !== 'Dinner') continue;
      AVAILABLE_TIMES = r.times.filter((t) => t.type === 'book');
    }
  } catch (error) {
    console.error(error);

    ERROR_COUNT++;

    if (ERROR_COUNT >= MIN_ERROR_COUNT) {
      ERROR = true;
      return;
    }
  }

  ERROR_COUNT = 0;

  if (!AVAILABLE_TIMES.length) {
    console.log('No available times found.');
    return;
  }

  const availableTimes = AVAILABLE_TIMES.map((t) => t.time).join(', ');

  const prettyDateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  STATUS_MESSAGE = `🍽️ Reservations available for ${VENUE_NAME} on ${prettyDateStr} at ${availableTimes}.\n\n${BOOKING_URL} .`;

  console.log(STATUS_MESSAGE);

  // Don't send a text if one was sent in the last 30 minutes
  if (Date.now() - LAST_TEXT_SENT_AT < TEXT_MAX_FREQUENCY_MINS * 60 * 1000) {
    console.log('Text already sent today');
    return;
  }

  LAST_TEXT_SENT_AT = Date.now();

  await sendPushAlert({
    mode: 'pushover',
    message: STATUS_MESSAGE,
  });
}
