// Rules for filtering leagues, checking spots and validating the form.
// These functions only work with data. They don't touch the page.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FILTERS = [
  { key: "day", label: "Day", all: "Any Day", options: DAYS },
  { key: "gender", label: "Gender", all: "Any", options: ["Co-Ed", "Men's", "Women's"] },
  { key: "format", label: "Format", all: "Any Format", options: ["7v7", "5v5"] },
  { key: "type", label: "Type", all: "Any Type", options: ["Individual", "Team"] },
];

const NO_FILTERS = { day: "", gender: "", format: "", type: "" };

const SORT_OPTIONS = [
  { value: "day", label: "Day of the week" },
  { value: "price", label: "Price (low to high)" },
  { value: "spots", label: "Most spots left" },
];

// Co-Ed leagues keep separate male and female spots
function spotTypes(league) {
  if (league.gender === "Men's") return ["male"];
  if (league.gender === "Women's") return ["female"];
  return ["male", "female"];
}

function takesIndividuals(league) {
  return league.indivPrice !== null;
}

function individualSpotsLeft(league) {
  return spotTypes(league).reduce((total, type) => total + league.spots[type], 0);
}

function canRegister(league) {
  return takesIndividuals(league) && individualSpotsLeft(league) > 0;
}

function hasSpotsFor(league, type) {
  return type === "Team" ? league.teamsLeft > 0 : canRegister(league);
}

// Team and individual each get their own status, so "Sold out" for teams
// is never read as the whole league being full
function individualStatus(league) {
  if (!takesIndividuals(league)) return { text: "Teams only", tone: "secondary" };
  if (!canRegister(league)) return { text: "Full (waitlist)", tone: "danger" };
  if (league.gender === "Co-Ed") {
    return { text: `${league.spots.male}M / ${league.spots.female}F left`, tone: "success" };
  }
  const left = individualSpotsLeft(league);
  return { text: `${left} ${left === 1 ? "spot" : "spots"} left`, tone: "success" };
}

function teamStatus(league) {
  if (league.teamsLeft === 0) return { text: "Sold out (waitlist)", tone: "danger" };
  return { text: `${league.teamsLeft} ${league.teamsLeft === 1 ? "team" : "teams"} left`, tone: "success" };
}

// "Registering as" keeps leagues that take that kind of registration, even
// if they are full right now, so full leagues still show with their status
function matchesFilter(league, key, value) {
  if (!value) return true;
  if (key === "type") return value === "Team" || takesIndividuals(league);
  return league[key] === value;
}

function filterLeagues(leagues, filters) {
  return leagues.filter((league) =>
    FILTERS.every((f) => matchesFilter(league, f.key, filters[f.key])));
}

// Leagues that only take teams have no individual price, so they go last by price
function sortLeagues(leagues, sortBy) {
  const sorted = [...leagues];
  if (sortBy === "price") {
    sorted.sort((a, b) => (a.indivPrice ?? Infinity) - (b.indivPrice ?? Infinity));
  } else if (sortBy === "spots") {
    sorted.sort((a, b) => individualSpotsLeft(b) - individualSpotsLeft(a));
  } else {
    sorted.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  }
  return sorted;
}

// When nothing matches: which filter to remove and how many leagues it brings back
function getSuggestions(leagues, filters) {
  return FILTERS
    .filter((f) => filters[f.key])
    .map((f) => ({
      key: f.key,
      value: filters[f.key],
      count: filterLeagues(leagues, { ...filters, [f.key]: "" }).length,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

// The league that meets the most chosen filters (ties go to one with spots)
function closestLeague(leagues, filters) {
  let best = null;
  let bestScore = -1;
  for (const league of leagues) {
    let score = FILTERS.filter((f) => filters[f.key] && matchesFilter(league, f.key, filters[f.key])).length;
    if (canRegister(league)) score += 0.5;
    if (score > bestScore) {
      best = league;
      bestScore = score;
    }
  }
  return best;
}

// Another league with the same gender mix and format that still has spots,
// preferring the same day, then the same venue
function similarLeague(league, leagues) {
  const score = (other) => (other.day === league.day ? 2 : 0) + (other.venue === league.venue ? 1 : 0);
  const options = leagues.filter((other) =>
    other.id !== league.id &&
    other.gender === league.gender &&
    other.format === league.format &&
    canRegister(other));
  options.sort((a, b) => score(b) - score(a));
  return options[0] || null;
}

function validateForm(values) {
  const errors = {};
  if (values.name.trim().length < 2) {
    errors.name = "Enter your full name.";
  }
  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter an email address like name@example.com.";
  }
  if (values.password.length < 8) {
    errors.password = "Create a password with at least 8 characters.";
  }
  if (!values.spot) {
    errors.spot = "Choose a male or female spot.";
  }
  if (!values.waiver) {
    errors.waiver = "Accept the player waiver to continue.";
  }
  return errors;
}
