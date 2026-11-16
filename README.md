# Ottawa Footy Sevens League Finder

COMP 3008 Assignment 4, Team 01

This is the working version of our Assignment 3 redesign (Design A). You can browse the winter soccer leagues, filter them, and sign up for one as an individual player. All the league info is made up, and registrations are only saved in your browser, so nothing actually gets sent anywhere.

## Running it

Online version: <ADD GITHUB PAGES LINK HERE>

To run it from the zip, unzip `Team01_A4_Source.zip` and double-click `index.html` inside the `Team01_A4_Source` folder. It opens in your browser. There's nothing to install and no login.

If the page shows up with no styling and gets stuck on "Loading leagues...", your browser probably isn't allowed to read the other files in that folder (this happened to us on a Mac). Either use the online link, or open a terminal in the `Team01_A4_Source` folder, run

```
python3 -m http.server 8000
```

and go to http://localhost:8000.

## Requirements

Any recent browser with JavaScript turned on (we tested in Chrome). Bootstrap 5.3.3 is included in the `css` folder, so the site works offline too. The only thing it loads from the internet is the Inter font from Google Fonts, and if that doesn't load, the page just uses the normal system font.

## Doing the task

The site starts on the Welcome page. The task is to find a Thursday evening Co-Ed 7v7 league that still has spots for individuals, check its price, start date, number of games and location, and register as an individual player.

1. Click **Find Your League**.
2. On the Leagues page, set Day to Thursday and Gender to Co-Ed. Two leagues should show up.
3. Click **View Details** on Thursday Rec Co-Ed 7v7 (clicking anywhere on the card works too).
4. Click **Register as Individual**.
5. Step 1 is a summary of the league plus a note about our partner Soccer 7s. Click **Continue to Step 2**.
6. Fill in any name and email (like test@example.com), a made-up password with at least 8 characters, pick male or female, and tick the waiver box. Tip: don't use a common password like `password1`, because Chrome sometimes pops up its own "change your password" warning over the page.
7. Click **Step 2 - Confirm Registration**. The confirmation page shows the league, start date and location. If you go back to the Leagues page, that league now has one less spot and says "You are registered".

## Other things to try

- Sorting: change the Sort by dropdown on the Leagues page (day, price, or most spots left).
- No results: set Day to Saturday and Type to Individual. The page says no league matches, suggests a filter to remove, and shows the closest league.
- Full league: open Thursday Late Co-Ed 7v7. Its individual spots are full, so you can join the waitlist or go to a similar league instead.
- Form errors: on step 2, click the confirm button without filling anything in.
- Connection error: open "Demo controls for testing" at the bottom of the page, tick "Make the next registration fail", then try to register. Click **Try again** to send it again.
- One spot type full: Friday Night Lights 7v7 has no female spots left, so that option is greyed out with a link to the waitlist.
- Starting over: "Reset demo data" in the demo controls clears all registrations and spot changes.

## Accessibility

Some things to check that don't really show up in screenshots:

- Everything works with just the keyboard (Tab, Shift+Tab, Enter, Space and the arrow keys), and whatever is focused gets a blue outline. The first Tab brings up a "Skip to main content" link. On a Mac, Safari and Firefox skip over links when you tab unless you change a setting, so Chrome is the easiest browser to check this in.
- When a new page opens, focus goes to its heading. If you submit the form with mistakes, focus goes to the list of errors at the top, and each one links to its field.
- With a screen reader on (VoiceOver is Cmd+F5 on a Mac), changing a filter reads out how many leagues match. Sorting, sending a registration and any errors are read out too.
- Statuses use a check mark or an X plus text, not just colour.
- At 200% zoom or in a phone-sized window, everything fits in one column without scrolling sideways.

## Files

- `index.html` - the page layout (nav bar, main area, and the footer with the demo controls)
- `css/style.css` - our styles on top of Bootstrap (`css/bootstrap.min.css` is the unmodified Bootstrap 5.3.3 file)
- `js/data.js` - the sample league data
- `js/logic.js` - filtering, sorting, spot statuses and form validation (`filterLeagues`, `sortLeagues`, `validateForm`, ...)
- `js/service.js` - a fake version of the Soccer 7s registration service (`getLeagues`, `registerPlayer`). It saves to localStorage and can be made to fail for testing.
- `js/views.js` - builds the HTML for each screen (`homeView`, `catalogueView`, `detailsView`, `reviewView`, `accountView`, `confirmationView`)
- `js/app.js` - keeps the app state, works out which page to show from the URL (`getRoute`), handles clicks and form submits, and redraws the page (`render`)

Registrations are stored in localStorage under `footy7s-a4`.
