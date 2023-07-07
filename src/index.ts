import { Request, Response } from 'express';
const cron = require('node-cron');
const express = require('express');

const app = express();

const SHOWTIMES = [
  111490819, // Oppenheimer Thursday 5pm
  111490820, // Oppenheimer Thursday 9:45pm
];

const WAIT_BETWEEN_CHECKS = 3000;

const QUERY = {
  operationName: 'TicketSelection',
  variables: { showtimeId: 111490820, hasToken: false },
  query:
    'query TicketSelection($showtimeId: Int!, $token: String, $hasToken: Boolean!) {\n  viewer {\n    id\n    showtime(id: $showtimeId) {\n      id\n      isReservedSeating\n      isPrivateRental\n      maximumIntendedAttendance\n      showDateTimeUtc\n      error {\n        id\n        message\n        __typename\n      }\n      movie {\n        id\n        name\n        movieId\n        slug\n        __typename\n      }\n      theatre {\n        id\n        slug\n        name\n        brand\n        ...CovidMessaging_Theatre\n        __typename\n      }\n      ...TicketTypeSelection_Showtime\n      ...SeatSelection_Showtime\n      ...UtilsGoogleTagManager_Showtime\n      ...FriendSelection_Showtime\n      ...PrivateShowingMovieSelection_Showtime\n      __typename\n    }\n    user {\n      id\n      account {\n        id\n        accountId\n        friendCount: friends {\n          id\n          items(status: CONFIRMED) {\n            id\n            count\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      ...TicketTypeSelection_User\n      ...FriendSelection_User\n      ...SeatSelection_User\n      __typename\n    }\n    order(token: $token) @include(if: $hasToken) {\n      id\n      ...TicketTypeSelection_Order\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment CovidMessaging_Theatre on Theatre {\n  id\n  attributes {\n    id\n    ...attributeExists_AttributeConnection\n    __typename\n  }\n  __typename\n}\n\nfragment attributeExists_AttributeConnection on AttributeConnection {\n  id\n  edges {\n    id\n    node {\n      id\n      code\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment SeatSelection_Showtime on Showtime {\n  id\n  attributes(first: 10) {\n    id\n    ...MovieTitleHeader_Attributes\n    __typename\n  }\n  display {\n    id\n    ...MovieTitleHeader_DateTimeDisplay\n    __typename\n  }\n  movie {\n    id\n    ...MovieTitleHeader_Movie\n    __typename\n  }\n  theatre {\n    id\n    ...MovieTitleHeader_Theatre\n    __typename\n  }\n  ...SocialSharing_Showtime\n  ...SeatingCheckout_Showtime\n  __typename\n}\n\nfragment MovieTitleHeader_Attributes on AttributeConnection {\n  id\n  edges {\n    id\n    node {\n      id\n      code\n      name\n      details {\n        id\n        premiumOffering\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment MovieTitleHeader_DateTimeDisplay on DateTimeDisplay {\n  id\n  prefix\n  date\n  time\n  dateShort\n  amPm\n  __typename\n}\n\nfragment MovieTitleHeader_Movie on Movie {\n  id\n  mpaaRating\n  name\n  runTime\n  websiteUrl\n  attributes {\n    id\n    edges {\n      id\n      node {\n        id\n        code\n        name\n        details {\n          id\n          premiumOffering\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  hero: image(contentType: HeroDesktopDynamic) {\n    id\n    url\n    __typename\n  }\n  poster: preferredPoster {\n    id\n    url\n    __typename\n  }\n  __typename\n}\n\nfragment MovieTitleHeader_Theatre on Theatre {\n  id\n  name\n  __typename\n}\n\nfragment SeatingCheckout_Showtime on Showtime {\n  id\n  showtimeId\n  attributes(first: 10) {\n    id\n    ...MovieTitleHeader_Attributes\n    __typename\n  }\n  allAttributes: attributes {\n    ...attributeExists_AttributeConnection\n    __typename\n  }\n  display {\n    id\n    ...MovieTitleHeader_DateTimeDisplay\n    __typename\n  }\n  movie {\n    id\n    ...MovieTitleHeader_Movie\n    __typename\n  }\n  theatre {\n    id\n    ...MovieTitleHeader_Theatre\n    __typename\n  }\n  ...Auditorium_Showtime\n  __typename\n}\n\nfragment Auditorium_Showtime on Showtime {\n  id\n  attributes(first: 10) {\n    ...Screen_Attributes\n    __typename\n  }\n  seatingLayout {\n    id\n    columns\n    error {\n      ...ErrorMessage_ErrorInfo\n      __typename\n    }\n    ...Layout_SeatingLayout\n    ...Legend_SeatingLayout\n    __typename\n  }\n  __typename\n}\n\nfragment ErrorMessage_ErrorInfo on ErrorInfo {\n  id\n  message\n  __typename\n}\n\nfragment Screen_Attributes on AttributeConnection {\n  id\n  edges {\n    id\n    node {\n      id\n      code\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment Layout_SeatingLayout on SeatingLayout {\n  id\n  rows\n  seats {\n    id\n    available\n    column\n    row\n    shouldDisplay\n    type\n    ...Seat_Seat\n    __typename\n  }\n  __typename\n}\n\nfragment Seat_Seat on Seat {\n  id\n  available\n  column\n  row\n  name\n  type\n  seatTier\n  shouldDisplay\n  zone {\n    id\n    name\n    type\n    surchargeAmount\n    discountAmount\n    __typename\n  }\n  __typename\n}\n\nfragment Legend_SeatingLayout on SeatingLayout {\n  id\n  seats {\n    id\n    available\n    seatTier\n    shouldDisplay\n    seatStatus\n    type\n    __typename\n  }\n  zones {\n    id\n    type\n    name\n    order\n    surchargeAmount\n    discountAmount\n    __typename\n  }\n  __typename\n}\n\nfragment SocialSharing_Showtime on Showtime {\n  id\n  when\n  shareShowtime {\n    id\n    url\n    __typename\n  }\n  movie {\n    id\n    name\n    movieStillDynamic: image(contentType: MovieStillDynamic) {\n      id\n      url\n      __typename\n    }\n    heroDesktopDynamic: image(contentType: HeroDesktopDynamic) {\n      id\n      url\n      __typename\n    }\n    __typename\n  }\n  theatre {\n    id\n    name\n    __typename\n  }\n  __typename\n}\n\nfragment SeatSelection_User on User {\n  id\n  ...SeatingCheckout_User\n  __typename\n}\n\nfragment SeatingCheckout_User on User {\n  id\n  ...Auditorium_User\n  __typename\n}\n\nfragment Auditorium_User on User {\n  id\n  ...Legend_User\n  ...Layout_User\n  __typename\n}\n\nfragment Legend_User on User {\n  id\n  account {\n    id\n    hasAlistSubscription: hasProductSubscription(subscriptionType: A_LIST)\n    __typename\n  }\n  ...ZoneTooltipModal_User\n  __typename\n}\n\nfragment ZoneTooltipModal_User on User {\n  account {\n    id\n    hasAlistSubscription: hasProductSubscription(subscriptionType: A_LIST)\n    __typename\n  }\n  selectedTheatre {\n    id\n    productSubscriptions(subscriptionType: A_LIST) {\n      id\n      items {\n        id\n        cost\n        productAttributes {\n          id\n          usageTier {\n            id\n            value\n            __typename\n          }\n          movieFilmWeekCap {\n            id\n            value\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment Layout_User on User {\n  id\n  ...Seat_User\n  __typename\n}\n\nfragment Seat_User on User {\n  id\n  account {\n    id\n    hasAlistSubscription: hasProductSubscription(subscriptionType: A_LIST)\n    __typename\n  }\n  __typename\n}\n\nfragment PrivateShowingMovieSelection_Showtime on Showtime {\n  display {\n    id\n    ...MovieTitleHeader_DateTimeDisplay\n    __typename\n  }\n  movie {\n    id\n    ...MovieTitleHeader_Movie\n    __typename\n  }\n  privateShowingMovies {\n    id\n    movieName\n    internalReleaseNumber\n    sku\n    price {\n      id\n      USD\n      __typename\n    }\n    movie {\n      id\n      movieId\n      genre\n      mpaaRating\n      name\n      runTime\n      image(contentType: PosterDynamic) {\n        id\n        url\n        __typename\n      }\n      ...MovieTitleHeader_Movie\n      __typename\n    }\n    __typename\n  }\n  theatre {\n    id\n    ...MovieTitleHeader_Theatre\n    __typename\n  }\n  movieTitleHeaderAttributes: attributes(first: 10) {\n    id\n    ...MovieTitleHeader_Attributes\n    __typename\n  }\n  __typename\n}\n\nfragment TicketTypeSelection_Showtime on Showtime {\n  id\n  isPrivateRental\n  maximumIntendedAttendance\n  showtimeId\n  ...AgeRestrictionNotice_Showtime\n  ...CheckoutNotifications_Showtime\n  ...DiscountMatineeDisclaimer_Showtime\n  ...ProductSubscriptionOption_Showtime\n  ...TicketSelectionDetails_Showtime\n  allAttributes: attributes {\n    id\n    edges {\n      id\n      node {\n        id\n        code\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  prices {\n    id\n    price: priceWithoutTax\n    type\n    sku\n    agePolicy\n    __typename\n  }\n  productSubscriptionDiscountEligibility {\n    id\n    isEligible\n    __typename\n  }\n  movieTitleHeaderAttributes: attributes(first: 10) {\n    id\n    ...MovieTitleHeader_Attributes\n    __typename\n  }\n  display {\n    id\n    ...MovieTitleHeader_DateTimeDisplay\n    __typename\n  }\n  movie {\n    id\n    ...MovieTitleHeader_Movie\n    __typename\n  }\n  theatre {\n    id\n    ...MovieTitleHeader_Theatre\n    ...ConcessionQuickAdd_Theatre\n    __typename\n  }\n  when\n  __typename\n}\n\nfragment AgeRestrictionNotice_Showtime on Showtime {\n  ...AgePolicyCopy_Showtime\n  __typename\n}\n\nfragment AgePolicyCopy_Showtime on Showtime {\n  id\n  display {\n    id\n    time\n    amPm\n    __typename\n  }\n  movie {\n    id\n    mpaaRating\n    __typename\n  }\n  __typename\n}\n\nfragment CheckoutNotifications_Showtime on Showtime {\n  id\n  showtimeId\n  notifications {\n    id\n    messages {\n      id\n      notificationId\n      __typename\n    }\n    ...TransactionNotification_TransactionNotifications\n    __typename\n  }\n  __typename\n}\n\nfragment TransactionNotification_TransactionNotifications on TransactionNotifications {\n  id\n  messages {\n    id\n    href\n    message\n    notificationId\n    __typename\n  }\n  __typename\n}\n\nfragment DiscountMatineeDisclaimer_Showtime on Showtime {\n  id\n  isDiscountMatineePriced\n  discountMatineeMessage\n  __typename\n}\n\nfragment ProductSubscriptionOption_Showtime on Showtime {\n  productSubscriptionDiscountEligibility {\n    id\n    isEligible\n    isOutOfTier\n    __typename\n  }\n  display {\n    id\n    monthDayYearSingleDigit\n    year\n    __typename\n  }\n  __typename\n}\n\nfragment ConcessionQuickAdd_Theatre on Theatre {\n  concession: concessionQuickAdd {\n    id\n    name\n    price\n    sku\n    image(contentType: Product) {\n      id\n      url\n      __typename\n    }\n    comboComponents {\n      id\n      concession {\n        sku\n        __typename\n      }\n      __typename\n    }\n    parentCategory {\n      id\n      name\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment TicketSelectionDetails_Showtime on Showtime {\n  id\n  ...TuesdayTicketMessaging_Showtime\n  isDiscountMatineePriced\n  discountMatineeMessage\n  isPrivateRental\n  prices {\n    id\n    price: priceWithoutTax\n    type\n    sku\n    agePolicy\n    __typename\n  }\n  productSubscriptionDiscountEligibility {\n    id\n    isEligible\n    isOutOfTier\n    __typename\n  }\n  maximumIntendedAttendance\n  __typename\n}\n\nfragment TuesdayTicketMessaging_Showtime on Showtime {\n  showDateTimeUtc\n  __typename\n}\n\nfragment TicketTypeSelection_User on User {\n  account {\n    id\n    accountId\n    alistProductSubscription: productSubscription(subscriptionType: A_LIST) {\n      id\n      reservationTicketType\n      __typename\n    }\n    ...ProductSubscriptionOption_Account\n    ...TicketSelectionDetails_Account\n    __typename\n  }\n  ...CheckoutNotifications_User\n  ...ZonedSeatingMessaging_User\n  __typename\n}\n\nfragment ZonedSeatingMessaging_User on User {\n  id\n  account {\n    id\n    accountId\n    hasAlistSubscription: hasProductSubscription(subscriptionType: A_LIST)\n    __typename\n  }\n  __typename\n}\n\nfragment CheckoutNotifications_User on User {\n  id\n  globalNotificationsDismissed\n  account {\n    id\n    notifications(type: PRODUCT_SUBSCRIPTION) {\n      ...AccountNotification_AccountNotifications\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment AccountNotification_AccountNotifications on AccountNotification {\n  id\n  href\n  message\n  notificationId\n  __typename\n}\n\nfragment ProductSubscriptionOption_Account on Account {\n  alistSubscription: productSubscription(subscriptionType: A_LIST) {\n    id\n    ...ProductSubscriptionOption_AccountProductSubscription\n    nextBillDate {\n      id\n      monthDayYearSingleDigit\n      __typename\n    }\n    pendingTransfer {\n      id\n      alistSubscription: productSubscription(subscriptionType: A_LIST) {\n        id\n        ...ProductSubscriptionOption_AccountProductSubscription\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ProductSubscriptionOption_AccountProductSubscription on AccountProductSubscription {\n  id\n  counters {\n    id\n    outOfTierVisitsCap {\n      id\n      current\n      max\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment TicketSelectionDetails_Account on Account {\n  alistSubscription: productSubscription(subscriptionType: A_LIST) {\n    id\n    reservationTicketType\n    ...ProductSubscriptionPausedMessage_AccountProductSubscription\n    __typename\n  }\n  __typename\n}\n\nfragment ProductSubscriptionPausedMessage_AccountProductSubscription on AccountProductSubscription {\n  id\n  pauseOptions {\n    id\n    canResume\n    __typename\n  }\n  statusName\n  __typename\n}\n\nfragment TicketTypeSelection_Order on Order {\n  id\n  ...ConcessionQuickAdd_Order\n  __typename\n}\n\nfragment ConcessionQuickAdd_Order on Order {\n  groups {\n    id\n    type\n    items {\n      id\n      sku\n      quantity\n      tokens\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment FriendSelection_User on User {\n  account {\n    id\n    accountId\n    firstName\n    lastName\n    friends {\n      id\n      items {\n        id\n        edges {\n          id\n          node {\n            id\n            ...EligibleFriend_AccountFriend\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment EligibleFriend_AccountFriend on AccountFriend {\n  id\n  nickname\n  firstName\n  lastName\n  friendGuid\n  email\n  favorite\n  pending\n  friendsSince {\n    id\n    dateShort\n    __typename\n  }\n  __typename\n}\n\nfragment FriendSelection_Showtime on Showtime {\n  productSubscriptionDiscountEligibility {\n    id\n    isEligible\n    isOutOfTier\n    error {\n      id\n      message\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment UtilsGoogleTagManager_Showtime on Showtime {\n  id\n  showtimeId\n  error {\n    id\n    message\n    __typename\n  }\n  movie {\n    id\n    name\n    movieId\n    __typename\n  }\n  theatre {\n    id\n    slug\n    name\n    theatreId\n    __typename\n  }\n  __typename\n}\n',
};

interface AMC_Response {
  data: {
    viewer: {
      showtime: {
        movie: {
          name: string;
        };
        display: {
          date: string;
          time: string;
          amPm: string;
        };
        seatingLayout: {
          seats: {
            id: string;
            available: boolean;
            column: number;
            row: number;
            type: 'NotASeat' | 'CanReserve' | 'Wheelchair';
            name: string; // e.g. A29
            seatStatus: string; // "Sold"
          }[];
        };
      };
    };
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let SHOWTIMES_WITH_SEATS: string[] = [];
let ERROR = false;

async function checkForSeats() {
  SHOWTIMES_WITH_SEATS = [];
  ERROR = false;

  for (const showtimeId of SHOWTIMES) {
    try {
      const response = (await fetch('https://graph.amctheatres.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...QUERY,
          variables: { showtimeId, hasToken: false },
        }),
      }).then((res) => res.json())) as AMC_Response;

      const availableSeats =
        response.data.viewer.showtime.seatingLayout.seats.filter(
          (s) =>
            s.available &&
            s.seatStatus !== 'Sold' &&
            s.type !== 'NotASeat' &&
            s.type !== 'Wheelchair'
        );

      const label = `Showtime: ${response.data.viewer.showtime.movie.name} ${response.data.viewer.showtime.display.date} at ${response.data.viewer.showtime.display.time}${response.data.viewer.showtime.display.amPm}`;

      if (availableSeats.length > 0) {
        SHOWTIMES_WITH_SEATS.push(label);
        console.log(
          `${response.data.viewer.showtime.display.date} ${response.data.viewer.showtime.display.time} has ${availableSeats.length} seats available`
        );
      }

      await delay(WAIT_BETWEEN_CHECKS);
    } catch (error) {
      console.error(error);
      ERROR = true;
    }
  }

  if (!SHOWTIMES_WITH_SEATS) {
    console.log('No seats found');
  }
}

cron.schedule(`*/1 * * * *`, async () => {
  await checkForSeats();
});

app.get('/', async (req: Request, res: Response) => {
  if (ERROR) {
    res.send('ERROR');
    return;
  }

  if (SHOWTIMES_WITH_SEATS.length) {
    res.send(SHOWTIMES_WITH_SEATS.join(', '));
    return;
  }

  res.send('NO_SEATS_AVAILABLE');
});

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log('Server is running on port', port);
});
