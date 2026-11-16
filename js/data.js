// Sample league data for the Winter 2026-27 season. This stands in for the
// league database. Changes (spots taken, waitlists) are saved separately in
// localStorage by service.js.
// spots = individual spots left. A league with indivPrice: null only takes teams.

const SEASON = "Winter 2026-27";

const LEAGUES = [
  { id: "thu-coed-ra", name: "Thursday Rec Co-Ed 7v7", day: "Thursday", time: "8:00 PM",
    gender: "Co-Ed", format: "7v7", venue: "RA Centre Turf", start: "2026-11-19", end: "2027-02-04",
    games: 10, minutes: 60, indivPrice: 245, teamPrice: 2200,
    spots: { male: 6, female: 4 }, waitlist: 0, teamsLeft: 0, teamWaitlist: 2 },

  { id: "thu-coed-uo", name: "Thursday Late Co-Ed 7v7", day: "Thursday", time: "9:30 PM",
    gender: "Co-Ed", format: "7v7", venue: "uOttawa Dome", start: "2026-11-19", end: "2027-02-04",
    games: 10, minutes: 60, indivPrice: 245, teamPrice: 2200,
    spots: { male: 0, female: 0 }, waitlist: 3, teamsLeft: 0, teamWaitlist: 1 },

  { id: "thu-mens-7", name: "Thursday Men's 7v7", day: "Thursday", time: "8:00 PM",
    gender: "Men's", format: "7v7", venue: "Louis-Riel Dome", start: "2026-11-19", end: "2027-02-04",
    games: 10, minutes: 60, indivPrice: 160, teamPrice: 1120,
    spots: { male: 5 }, waitlist: 0, teamsLeft: 1, teamWaitlist: 0 },

  { id: "mon-mens-7", name: "Monday Night Men's 7v7", day: "Monday", time: "8:00 PM",
    gender: "Men's", format: "7v7", venue: "uOttawa Dome", start: "2026-11-16", end: "2027-01-25",
    games: 10, minutes: 60, indivPrice: 160, teamPrice: 1120,
    spots: { male: 8 }, waitlist: 0, teamsLeft: 2, teamWaitlist: 0 },

  { id: "tue-coed-5", name: "Tuesday Co-Ed 5v5", day: "Tuesday", time: "7:00 PM",
    gender: "Co-Ed", format: "5v5", venue: "Louis-Riel Dome", start: "2026-11-17", end: "2027-01-26",
    games: 10, minutes: 50, indivPrice: 140, teamPrice: 700,
    spots: { male: 2, female: 5 }, waitlist: 0, teamsLeft: 3, teamWaitlist: 0 },

  { id: "wed-coed-7", name: "Wednesday Co-Ed 7v7", day: "Wednesday", time: "8:00 PM",
    gender: "Co-Ed", format: "7v7", venue: "Louis-Riel Dome", start: "2026-11-18", end: "2027-01-27",
    games: 10, minutes: 60, indivPrice: 145, teamPrice: 1015,
    spots: { male: 6, female: 7 }, waitlist: 0, teamsLeft: 1, teamWaitlist: 0 },

  { id: "wed-mens-5", name: "Wednesday Men's 5v5", day: "Wednesday", time: "9:00 PM",
    gender: "Men's", format: "5v5", venue: "RA Centre Turf", start: "2026-11-18", end: "2027-01-27",
    games: 10, minutes: 50, indivPrice: 135, teamPrice: 675,
    spots: { male: 4 }, waitlist: 0, teamsLeft: 0, teamWaitlist: 0 },

  { id: "fri-coed-7", name: "Friday Night Lights 7v7", day: "Friday", time: "8:00 PM",
    gender: "Co-Ed", format: "7v7", venue: "RA Centre Turf", start: "2026-11-20", end: "2027-02-05",
    games: 10, minutes: 60, indivPrice: 150, teamPrice: 1050,
    spots: { male: 3, female: 0 }, waitlist: 0, teamsLeft: 2, teamWaitlist: 0 },

  { id: "sat-coed-comp", name: "Saturday Competitive Co-Ed 7v7", day: "Saturday", time: "4:00 PM",
    gender: "Co-Ed", format: "7v7", venue: "RA Centre Turf", start: "2026-11-21", end: "2027-02-06",
    games: 10, minutes: 60, indivPrice: null, teamPrice: 2400,
    spots: { male: 0, female: 0 }, waitlist: 0, teamsLeft: 2, teamWaitlist: 0 },

  { id: "sun-womens-7", name: "Sunday Women's 7v7", day: "Sunday", time: "6:00 PM",
    gender: "Women's", format: "7v7", venue: "uOttawa Dome", start: "2026-11-22", end: "2027-02-07",
    games: 10, minutes: 60, indivPrice: 150, teamPrice: 1050,
    spots: { female: 9 }, waitlist: 0, teamsLeft: 3, teamWaitlist: 0 },
];
