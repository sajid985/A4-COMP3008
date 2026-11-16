// Mock service that stands in for the Soccer 7s registration system.
// It waits like a real request would, then reads and writes localStorage.

const STORAGE_KEY = "footy7s-a4";
let failNextRequest = false; // turned on from the demo controls in the footer

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Saved data, with defaults filled in so missing or damaged data can't break the page
function loadSaved() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    saved = {};
  }
  return {
    spots: saved.spots || {},
    waitlists: saved.waitlists || {},
    registrations: Array.isArray(saved.registrations) ? saved.registrations : [],
  };
}

// A league from data.js with any saved changes applied
function applySaved(league, saved) {
  return {
    ...league,
    spots: { ...league.spots, ...saved.spots[league.id] },
    waitlist: saved.waitlists[league.id] ?? league.waitlist,
  };
}

async function getLeagues() {
  await delay(200);
  const saved = loadSaved();
  return LEAGUES.map((league) => applySaved(league, saved));
}

function getRegistrations() {
  return loadSaved().registrations;
}

function serviceError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// kind is "individual" (takes a spot) or "waitlist" (joins the line)
async function registerPlayer(leagueId, kind, player) {
  await delay(800);

  if (failNextRequest) {
    failNextRequest = false;
    throw serviceError("network", "We couldn't reach Soccer 7s, so nothing was saved.");
  }

  const saved = loadSaved();
  const league = applySaved(LEAGUES.find((l) => l.id === leagueId), saved);
  let position = null;

  // One registration per league, so a repeated request can't take a second spot
  if (saved.registrations.some((r) => r.leagueId === leagueId)) {
    throw serviceError("duplicate", "You're already registered for this league, so nothing was changed.");
  }

  if (kind === "individual") {
    const left = league.spots[player.spot];
    if (!left) {
      throw serviceError("full", `The last ${player.spot} spot in this league was just taken.`);
    }
    saved.spots[leagueId] = { ...league.spots, [player.spot]: left - 1 };
  } else {
    position = league.waitlist + 1;
    saved.waitlists[leagueId] = position;
  }

  const registration = {
    id: "FS-" + String(Date.now()).slice(-6),
    leagueId,
    kind,
    position,
    name: player.name.trim(),
    email: player.email.trim(),
    spot: player.spot,
  };
  saved.registrations.push(registration);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return registration;
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}
