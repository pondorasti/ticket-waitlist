import z from 'zod';
import twilio from 'twilio';

/**
 * Configure these values to your liking.
 */
// const EVENT_ID = '64de74ca2d4ca900013dffc6';
const PLATFORM_NAME = 'SeatGeek';
const EVENT_NAME = 'Lakers vs. Suns (SeatGeek)';
const SEATS_TOGETHER = 2;
const MAX_ALL_IN_PRICE_PER_SEAT = 300;
const SECTIONS_REGEX = [/^premier/, /^1/];
const MAX_RETURN_LIST = 10;

// wait until getting this many consecutive errors before creating an error state
const MIN_ERROR_COUNT = 4;

// Don't send more than one text every const TEXT_MAX_FREQUENCY_MINS mins.
const TEXT_MAX_FREQUENCY_MINS = 15;
const TWILIO_FROM_NUMBER = '+18335631518';
const TWILIO_TO_NUMBERS = ['+18144107394'];

/**
 * You probably don't need to change anything below this line.
 */

const pricesSeen: number[] = [];

const listingObj = z.object({
  s: z.string(), // section number
  r: z.string(), // row number
  dp: z.number(), // total price
  q: z.number(), // quantity
  sp: z.array(z.number()), // lots
});

type Listing = z.infer<typeof listingObj>;

export const outputSchema = z.object({
  listings: z.array(listingObj),
});

let AVAILABLE_SEATS: Listing[] = [];
let LAST_TEXT_SENT_AT = 0;
let ERROR_COUNT = 0;
let ERROR = false;
let STATUS_MESSAGE = 'NO_SEATS';

export function getStatusMessage() {
  return ERROR ? 'ERROR' : STATUS_MESSAGE;
}

function calculateTotalPrice(listing: Listing) {
  return listing.dp;
}

const fmtPrice = (price: number) =>
  price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

// idk how much of this URL is necessary and whether any of it changes the results, I copied it from the network tab
// most of these seem like analytics stuff, a few probably opt you into certain tests
// (e.g. zone_deals_true_v4, cost_plus_v0, control_v1)
const fullUrl = `https://seatgeek.com/api/event_listings_v2?_include_seats=1&client_id=MTY2MnwxMzgzMzIwMTU4&event_page_view_id=6aed535e-d38b-43ea-8b72-3309062c1ef3&id=6120063&sixpack_client_id=069d73a8-6543-40a4-b68d-faf9d4c8787f`;

export async function check() {
  AVAILABLE_SEATS = [];
  STATUS_MESSAGE = 'NO_SEATS';
  ERROR = false;

  const response = await fetch(fullUrl).then((res) => res.json());

  try {
    const res = outputSchema.safeParse(response);

    if (!res.success) {
      console.log('error parsing response');
      console.log(res.error);
      return;
    }

    const data = res.data;

    AVAILABLE_SEATS = Object.values(data.listings)
      .filter((l) => {
        // must have at least SEATS_TOGETHER seats
        if (l.q < SEATS_TOGETHER) return false;

        // SEATS_TOGETHER seats must be in the same lot
        if (!l.sp.includes(SEATS_TOGETHER)) return false;

        // must be in a section that matches SECTIONS_REGEX or SECTION_GROUP_NAMES
        if (!SECTIONS_REGEX.some((r) => r.test(l.s))) {
          return false;
        }

        // all-in price per seat must be less than MAX_ALL_IN_PRICE_PER_SEAT
        if (calculateTotalPrice(l) > MAX_ALL_IN_PRICE_PER_SEAT) return false;

        return true;
      })
      .sort((a, b) => {
        const aPrice = calculateTotalPrice(a);
        const bPrice = calculateTotalPrice(b);
        return aPrice - bPrice;
      })
      .slice(0, MAX_RETURN_LIST);
  } catch (error) {
    console.error(error);

    ERROR_COUNT++;

    if (ERROR_COUNT >= MIN_ERROR_COUNT) {
      ERROR = true;
      return;
    }
  }

  ERROR_COUNT = 0;

  if (!AVAILABLE_SEATS.length) {
    console.log('No seats found.');
    return;
  }

  const readout = AVAILABLE_SEATS.map((l) => {
    const allInEach = calculateTotalPrice(l);
    const total = allInEach * SEATS_TOGETHER;

    const formattedEach = fmtPrice(allInEach);
    const formattedTotal = fmtPrice(total);

    return `- Sec ${l.s} Row ${l.r}, ${formattedEach} each (${formattedTotal} total)`;
  });

  STATUS_MESSAGE = `🏀 Seats available for ${EVENT_NAME}!\n`;
  STATUS_MESSAGE += `(checking ${PLATFORM_NAME} for ${SEATS_TOGETHER} seats together at ${fmtPrice(
    MAX_ALL_IN_PRICE_PER_SEAT
  )} each in sections similar to ${SECTIONS_REGEX.join(', ')})`;

  const lowestPrice = calculateTotalPrice(AVAILABLE_SEATS[0]);

  if (!pricesSeen.length) {
    pricesSeen.push(lowestPrice);
  } else {
    const lowestPriceSeen = Math.min(...pricesSeen);
    const lastPriceSeen = pricesSeen[pricesSeen.length - 1];

    pricesSeen.push(lowestPrice);

    if (lowestPrice < lowestPriceSeen) {
      STATUS_MESSAGE += `\n\n⭐ New lowest price on ${PLATFORM_NAME}: ${fmtPrice(
        lowestPrice
      )}\n`;
    } else if (lowestPrice < lastPriceSeen) {
      console.log(
        `🔻 ${PLATFORM_NAME} price decreased to ${fmtPrice(lowestPrice)}`
      );
      return;
    } else if (lowestPrice > lastPriceSeen) {
      console.log(
        `🔺 ${PLATFORM_NAME} price increased to ${fmtPrice(lowestPrice)}`
      );
      return;
    } else {
      console.log(
        `🔄 ${PLATFORM_NAME} Price unchanged at ${fmtPrice(lowestPrice)}`
      );
      return;
    }
  }

  for (const line of readout) {
    STATUS_MESSAGE += `\n${line}`;
  }

  // Don't send a text if one was sent in the last 30 minutes
  if (Date.now() - LAST_TEXT_SENT_AT < TEXT_MAX_FREQUENCY_MINS * 60 * 1000) {
    console.log(
      `Text already sent within the last ${TEXT_MAX_FREQUENCY_MINS} minutes.`
    );
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(STATUS_MESSAGE + '\n\n\n');
    return;
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  for (const to of TWILIO_TO_NUMBERS) {
    try {
      await client.messages.create({
        to,
        body: STATUS_MESSAGE,
        from: TWILIO_FROM_NUMBER,
      });
    } catch (error) {
      console.error(`Error sending message to ${to}: ${error}`);
      ERROR = true;
    }
  }

  LAST_TEXT_SENT_AT = Date.now();
}
