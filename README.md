This is a collection of scripts that I've created to poll for open reservations on various ticketing platforms. Inside `src/platforms` you'll find scripts for AMC (movies), Gametime (sports), SeatGeek (sports), and SevenRooms (restaurants).

The AMC and SevenRooms scripts are intended to watch sold-out events and alert about openings, while the SeatGeek and Gametime scripts track prices and alert about price drops.

🚧 _These scripts are pretty hacky and some coding experience is needed to configure and run them._ 🚧

## Configuring events

Event configuration is hardcoded into these scripts so I recommend cloning this and running your own instance, either locally or somewhere like [Railway](https://railway.app).

Here is how I'd watch for openings for a movie at an AMC theater:

1. Clone this repo to your GitHub account
2. Download it and run it locally
3. See [`src/platforms/amc.ts`](src/platforms/amc.ts) and configure it to your liking (showtime IDs, seats, rows, etc)
4. Push the changes and deploy to [Railway](https://railway.app)
5. Set up [Pushover](https://pushover.net) to receive push alerts on your phone (see below for instructions)

There are instructions for getting event IDs in each of the platform files.

See the top of [`src/index.ts`](src/index.ts) to enable the service you want to use.

## Sending push alerts

I use [Pushover](https://pushover.net) to send push alerts on iOS. You'll need to add `PUSHOVER_TOKEN` and `PUSHOVER_USER` as environment variables wherever you run the app. You can get `PUSHOVER_TOKEN` by creating an application in your Pushover account, and `PUSHOVER_USER` will be the user ID listed in your dashboard.

There's also a Twilio option that you can use to send SMS if you have an account and registered phone number handy.
