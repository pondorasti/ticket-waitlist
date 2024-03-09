This is a collection of scripts that I've created to poll for open reservations on various ticketing platforms. Inside `src/platforms` you'll find scripts for AMC (movies), Gametime (sports), SeatGeek (sports), and SevenRooms (restaurants).

The AMC and SevenRooms scripts are intended to watch sold-out events and alert about openings, while the SeatGeek and Gametime scripts track prices and alert about price drops.

🚧 _Some coding experience is needed to modify and run these scripts._

## Configuring events

Event configuration is hardcoded into these scripts so I recommend cloning this and running your own instance. If you clone this repo to your own GitHub account and then run it on [Railway](https://railway.app) it should work great out of the box.

There are instructions for getting event IDs in each of the platform files.

See the top of `src/index.ts` to enable the service you want to use.

## Sending push alerts

I use [Pushover](https://pushover.net) to send myself push alerts on iOS. After you sign up for an account, create an application and copy the API token into the `PUSHOVER_TOKEN` environment variable. Grab your user key and set it as the `PUSHOVER_USER` environment variable.

There's also a Twilio option that you can use to send SMS if you have an account and registered phone number handy.
