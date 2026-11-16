// Functions that build the HTML for each screen from the current state.

const SPOT_NAMES = { male: "Male", female: "Female" };

// "Type" gets the widest column because its options are longest
const FILTER_WIDTHS = { day: "col-lg-3", gender: "col-lg-2", format: "col-lg-3", type: "col-lg-4" };

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function money(amount) {
  return "$" + amount.toLocaleString("en-CA");
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function formatDate(iso, withYear = true) {
  const [y, m, d] = iso.split("-").map(Number);
  const options = { weekday: "short", month: "short", day: "numeric" };
  if (withYear) options.year = "numeric";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", options);
}

// Status shows a symbol and text, not just a colour
function badge(status) {
  const symbol = { success: "✓", danger: "✕", secondary: "–" }[status.tone];
  return `<span class="badge rounded-pill bg-${status.tone}-subtle text-${status.tone}-emphasis border border-${status.tone}-subtle">` +
    `<span aria-hidden="true">${symbol}</span> ${esc(status.text)}</span>`;
}

function pageTitle(text) {
  return `<h1 id="page-title" class="page-title" tabindex="-1">${esc(text)}</h1>`;
}

function breadcrumb(items) {
  const parts = items.map(([label, href]) => href
    ? `<li class="breadcrumb-item"><a href="${href}" class="link-dark">${esc(label)}</a></li>`
    : `<li class="breadcrumb-item active" aria-current="page">${esc(label)}</li>`);
  return `<nav aria-label="Breadcrumb"><ol class="breadcrumb small">${parts.join("")}</ol></nav>`;
}

function fact(label, value) {
  return `<div class="fact"><dt>${label}</dt><dd>${value}</dd></div>`;
}

function loadErrorView() {
  return `
    ${pageTitle("Leagues couldn't be loaded")}
    <p>Something went wrong while loading the league list.</p>
    <button type="button" class="btn btn-dark" data-action="reload">Try again</button>`;
}

function notFoundView(title) {
  return `
    ${pageTitle(title)}
    <p>It may have been removed.</p>
    <a href="#/leagues" class="btn btn-dark">Back to League Selection</a>`;
}

/* ---------- Home ---------- */

function homeView() {
  return `
    <section class="py-5">
      <h1 id="page-title" class="display-3 fw-bold mb-3" tabindex="-1">Welcome</h1>
      <p class="lead text-muted mb-4">Find a recreational soccer league in Ottawa that fits your schedule, then sign up as an individual player.</p>
      <a href="#/leagues" class="btn btn-dark btn-lg px-4" id="find-league">Find Your League</a>
    </section>`;
}

/* ---------- League Selection: all leagues, filters, sorting and No Matches ---------- */

function optionLabel(leagues, filters, filter, value) {
  const matches = filterLeagues(leagues, { ...filters, [filter.key]: value });
  if (filter.key === "type" && value) {
    const open = matches.filter((l) => hasSpotsFor(l, value)).length;
    return `${value} (${plural(matches.length, "league")}, ${open} with spots)`;
  }
  return `${value || filter.all} (${matches.length})`;
}

function catalogueView(state) {
  const { leagues, filters } = state;
  const matches = sortLeagues(filterLeagues(leagues, filters), state.sort);
  const active = FILTERS.filter((f) => filters[f.key]);

  const selects = FILTERS.map((f) => `
    <div class="col-sm-6 ${FILTER_WIDTHS[f.key]}">
      <label for="filter-${f.key}" class="form-label small text-muted">${f.label}</label>
      <select id="filter-${f.key}" class="form-select" data-filter="${f.key}">
        ${["", ...f.options].map((value) => `
          <option value="${esc(value)}" ${filters[f.key] === value ? "selected" : ""}>${esc(optionLabel(leagues, filters, f, value))}</option>`).join("")}
      </select>
    </div>`).join("");

  const chips = active.map((f) => `
    <button type="button" class="btn btn-sm btn-outline-dark rounded-pill" id="chip-${f.key}"
      data-action="remove-filter" data-key="${f.key}" aria-label="Remove filter ${f.label}: ${esc(filters[f.key])}">
      ${f.label}: ${esc(filters[f.key])} <span aria-hidden="true">×</span>
    </button>`).join("");

  const sortOptions = SORT_OPTIONS.map((o) => `
    <option value="${o.value}" ${state.sort === o.value ? "selected" : ""}>${o.label}</option>`).join("");

  return `
    ${pageTitle("Leagues")}
    <p class="text-muted">Every league for the ${SEASON} season is in this one list. Narrow it down with the filters, then choose View Details.</p>

    <form class="filters" aria-label="Filter leagues">
      <div class="row g-3">${selects}</div>
      <p class="form-text mb-0 mt-2">Numbers show how many leagues each choice would leave. Full leagues stay in the list with their status.</p>
    </form>

    <div class="d-flex flex-wrap align-items-center gap-2 mt-4 mb-3">
      <h2 id="results-title" class="h5 fw-normal mb-0 me-2" tabindex="-1">
        Showing <strong>${matches.length}</strong> of ${plural(leagues.length, "league")}
      </h2>
      ${active.length
        ? `${chips}<button type="button" class="btn btn-link btn-sm link-dark" id="clear-filters" data-action="clear-filters">Clear all filters</button>`
        : ""}
      <div class="ms-auto d-flex align-items-center gap-2">
        <label for="sort-by" class="small text-muted text-nowrap">Sort by:</label>
        <select id="sort-by" class="form-select form-select-sm w-auto">${sortOptions}</select>
      </div>
    </div>

    ${matches.length
      ? matches.map((l) => leagueCard(l, state.registrations)).join("")
      : noMatchesView(leagues, filters)}`;
}

// One league in the list. Team and individual each show their own price and status.
function leagueCard(league, registrations) {
  const registration = registrations.find((r) => r.leagueId === league.id);
  const registeredLabel = registration && (registration.kind === "waitlist" ? "On the waitlist" : "You are registered");
  return `
    <article class="card league-card mb-3" data-league-id="${league.id}">
      <div class="card-body p-4 d-flex flex-column flex-md-row gap-3 align-items-md-center">
        <div class="flex-grow-1">
          <h3 class="h4 mb-1">
            ${esc(league.name)} <span class="tag">${esc(league.gender)}</span>
            ${registeredLabel ? `<span class="badge text-bg-warning align-middle fs-6">${registeredLabel}</span>` : ""}
          </h3>
          <p class="text-muted mb-2">Indoor ${league.format} - ${esc(league.venue)} - ${league.games} games - ${league.minutes} min</p>
          <p class="mb-2">
            <span class="text-muted me-3">${league.day}s</span>
            <span class="text-muted me-3">${league.time}</span>
            <span class="text-muted me-3">Starts ${formatDate(league.start, false)}</span>
            ${takesIndividuals(league)
              ? `<strong>${money(league.indivPrice)} / player</strong>`
              : `<strong>${money(league.teamPrice)} / team</strong>`}
          </p>
          <div class="d-flex flex-wrap gap-3 small">
            <span>Individual: ${badge(individualStatus(league))}</span>
            <span>Team (${money(league.teamPrice)}): ${badge(teamStatus(league))}</span>
          </div>
        </div>
        <a href="#/leagues/${league.id}" class="btn btn-dark px-4 text-nowrap">
          View Details<span class="visually-hidden"> for ${esc(league.name)}</span>
        </a>
      </div>
    </article>`;
}

function noMatchesView(leagues, filters) {
  const chosen = FILTERS.filter((f) => filters[f.key]).map((f) => filters[f.key]).join(" + ");
  const suggestions = getSuggestions(leagues, filters);
  const closest = closestLeague(leagues, filters);

  return `
    <section class="card border-start border-4 border-warning no-matches" aria-labelledby="no-matches-title">
      <div class="card-body p-4">
        <h3 id="no-matches-title" class="h4">No leagues match these filters</h3>
        <p>No league this season matches <strong>${esc(chosen)}</strong>.
          The filters are working; this combination just doesn't exist.</p>

        ${suggestions.length ? `
          <p class="fw-semibold mb-2">Try removing one filter:</p>
          <div class="d-flex flex-wrap gap-2 mb-3 suggestions">
            ${suggestions.map((s) => `
              <button type="button" class="btn btn-outline-dark btn-sm" data-action="remove-filter" data-key="${s.key}">
                Remove "${esc(s.value)}" (shows ${plural(s.count, "league")})
              </button>`).join("")}
          </div>` : ""}

        ${closest ? `
          <p class="fw-semibold mb-2">Closest league:</p>
          <a href="#/leagues/${closest.id}" class="card card-body mb-3 text-decoration-none text-body closest-card">
            <span class="fw-semibold">${esc(closest.name)}</span>
            <span class="small text-muted">${closest.day}s, ${closest.time} - ${esc(closest.venue)}</span>
            <span class="small mt-1">Individual: ${badge(individualStatus(closest))}</span>
          </a>` : ""}

        <button type="button" class="btn btn-dark" data-action="clear-filters">Show all leagues</button>
      </div>
    </section>`;
}

/* ---------- League Details, including the Individual Full state ---------- */

function detailsView(state, league) {
  if (!league) return notFoundView("League not found");
  const registration = state.registrations.find((r) => r.leagueId === league.id);
  const individualSpots = takesIndividuals(league)
    ? spotTypes(league).map((t) => `${league.spots[t]} ${SPOT_NAMES[t]}`).join(" / ")
    : "teams only";
  const teamSpots = league.teamsLeft === 0 ? "sold out" : plural(league.teamsLeft, "team");

  return `
    ${breadcrumb([["League Selection", "#/leagues"], [league.name]])}
    <p class="eyebrow">League Details</p>
    ${pageTitle(league.name)}

    ${registration ? `
      <div class="alert alert-success">
        <strong>${registration.kind === "waitlist"
          ? `You are #${registration.position} on the waitlist for this league.`
          : "You are registered for this league."}</strong>
        Confirmation number ${registration.id}.
        <a href="#/confirmation/${registration.id}" class="alert-link">View confirmation</a>
      </div>` : ""}

    <section class="card mb-4" aria-label="League details">
      <div class="card-body p-4">
        <dl class="mb-0">
          ${fact("League type", `${esc(league.gender)} ${league.format}, indoor (${SEASON} season)`)}
          ${fact("When", `${league.day}s at ${league.time}`)}
          ${fact("Dates", `${formatDate(league.start)} to ${formatDate(league.end)} | No games Dec 24 to Jan 3`)}
          ${fact("Games", `${league.games} (playoffs included), ${league.minutes} min each`)}
          ${fact("Price", `${takesIndividuals(league) ? `Individual: ${money(league.indivPrice)} + tax | ` : ""}Team: ${money(league.teamPrice)} + tax`)}
          ${fact("Where", esc(league.venue))}
          ${fact("Spots left", `Individual: ${individualSpots} | Team: ${teamSpots}`)}
        </dl>
      </div>
    </section>

    <h2 class="h4 mb-3">Register</h2>
    <div class="row g-3 register-options">
      <div class="col-md-6">${individualCard(state, league, registration)}</div>
      <div class="col-md-6">${teamCard(league)}</div>
    </div>

    <p class="mt-4"><a href="#/leagues" class="link-dark"><span aria-hidden="true">←</span> Back to League Selection</a></p>`;
}

function individualCard(state, league, registration) {
  const similar = similarLeague(league, state.leagues);
  const similarLink = similar
    ? `<a href="#/leagues/${similar.id}" class="btn btn-outline-dark" id="see-similar">See a similar league: ${esc(similar.name)}</a>`
    : "";
  let body;

  if (!takesIndividuals(league)) {
    body = `<p class="text-muted">This league only takes full teams.</p>${similarLink}`;
  } else if (registration) {
    body = `
      <button type="button" class="btn btn-dark disabled" aria-disabled="true">Register as Individual</button>
      <p class="small text-muted mt-2 mb-0">${registration.kind === "waitlist"
        ? `You're #${registration.position} on the waitlist for this league.`
        : "You already have a spot in this league."}</p>`;
  } else if (!canRegister(league)) {
    // Individual Full: say so plainly and offer two ways forward
    body = `
      <div class="alert alert-warning mb-0" id="individual-full">
        <h3 class="h6">Individual spots are full</h3>
        <p>You can hold a place in line, or try a similar league that still has space.
          ${league.waitlist} ${league.waitlist === 1 ? "person is" : "people are"} on the waitlist.</p>
        <div class="d-flex flex-wrap gap-2">
          <a href="#/waitlist/${league.id}/review" class="btn btn-dark" id="join-waitlist">Join the Waitlist</a>
          ${similarLink}
        </div>
      </div>`;
  } else {
    body = `<a href="#/register/${league.id}/review" class="btn btn-dark" id="register-individual">Register as Individual</a>`;
  }

  return `
    <div class="card h-100 ${takesIndividuals(league) && !canRegister(league) ? "border-warning" : ""}">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-baseline">
          <h3 class="h5 mb-0">Individual player</h3>
          ${takesIndividuals(league)
            ? `<span class="fs-5 fw-bold">${money(league.indivPrice)} <small class="text-muted fw-normal">+ tax</small></span>`
            : ""}
        </div>
        <p class="my-3">${badge(individualStatus(league))}</p>
        ${body}
      </div>
    </div>`;
}

// Team registration isn't part of this task, but its status is still shown
function teamCard(league) {
  const soldOut = league.teamsLeft === 0;
  return `
    <div class="card h-100 option-team">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-baseline">
          <h3 class="h5 mb-0">Team</h3>
          <span class="fs-5 fw-bold">${money(league.teamPrice)} <small class="text-muted fw-normal">+ tax</small></span>
        </div>
        <p class="my-3">${badge(teamStatus(league))}</p>
        ${soldOut ? `
          <button type="button" class="btn btn-secondary disabled" aria-disabled="true" aria-describedby="team-note">Register a Team</button>
          <p class="small text-muted mt-2 mb-0" id="team-note">Team spots are sold out${league.teamWaitlist
            ? ` (${plural(league.teamWaitlist, "team")} on the waitlist)` : ""}. This does not affect individual spots.</p>`
        : `<p class="small text-muted mb-0">Team captains register the whole team at once. Team registration is not part of this demo.</p>`}
      </div>
    </div>`;
}

/* ---------- Registration: step 1 (review) and step 2 (account) ---------- */

function stepHeader(league, kind, step, title) {
  return `
    ${breadcrumb([["League Selection", "#/leagues"], [league.name, `#/leagues/${league.id}`], [kind === "waitlist" ? "Join Waitlist" : "Register"]])}
    <p class="eyebrow step-count">Step ${step} of 2</p>
    <div class="progress progress-thin mb-3" role="progressbar" aria-label="Registration progress"
      aria-valuenow="${step * 50}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar bg-dark ${step === 1 ? "w-50" : "w-100"}"></div>
    </div>
    ${pageTitle(title)}`;
}

function partnerBanner(detail) {
  return `
    <div class="info-banner partner-notice mb-4" role="note">
      <span class="info-icon" aria-hidden="true">i</span>
      <div>
        <p class="fs-5 mb-1">This league runs with our partner Soccer 7s</p>
        ${detail ? `<p class="mb-0">${detail}</p>` : ""}
      </div>
    </div>`;
}

function summaryCard(league, kind) {
  const waitlist = kind === "waitlist";
  return `
    <section class="card summary" aria-labelledby="summary-title">
      <div class="card-body p-4">
        <h2 id="summary-title" class="h5 mb-3">${waitlist ? "You're joining the waitlist for" : "You're registering for"}</h2>
        <dl class="mb-0">
          ${fact("League", esc(league.name))}
          ${fact("Registering as", `Individual player${waitlist ? " (waitlist)" : ""}`)}
          ${fact("Price", `${money(league.indivPrice)} + tax${waitlist ? " (only charged if a spot opens)" : ""}`)}
          ${fact("Starts", `${formatDate(league.start)}, ${league.time}`)}
          ${fact("Where", esc(league.venue))}
          ${waitlist ? fact("Waitlist", `You would be #${league.waitlist + 1} in line`) : ""}
        </dl>
      </div>
    </section>`;
}

// Shown if individual spots ran out before the user got to registration
function nowFullView(league) {
  return `
    ${pageTitle("Individual spots are now full")}
    <div class="alert alert-warning">
      <p>The last individual spot in <strong>${esc(league.name)}</strong> has been taken. You can join the waitlist instead.</p>
      <a href="#/waitlist/${league.id}/review" class="btn btn-dark">Join the Waitlist</a>
      <a href="#/leagues/${league.id}" class="btn btn-outline-dark">Back to League</a>
    </div>`;
}

// Shown if the user comes back to registration (e.g. with the Back button) after registering
function alreadyRegisteredView(league, registration) {
  const waitlist = registration.kind === "waitlist";
  return `
    ${pageTitle(waitlist ? "You're already on the waitlist" : "You're already registered")}
    <div class="alert alert-success">
      <p>${waitlist ? `You're #${registration.position} on the waitlist for` : "You already have a spot in"}
        <strong>${esc(league.name)}</strong> (confirmation ${registration.id}).</p>
      <a href="#/confirmation/${registration.id}" class="btn btn-dark">View Confirmation</a>
      <a href="#/leagues" class="btn btn-outline-dark">Back to League Selection</a>
    </div>`;
}

// Shown if a registration link is opened for a league that only takes teams
function teamsOnlyView(state, league) {
  const similar = similarLeague(league, state.leagues);
  return `
    ${pageTitle("This league only takes full teams")}
    <div class="alert alert-secondary">
      <p><strong>${esc(league.name)}</strong> doesn't take individual players, so there's nothing to register for here.</p>
      ${similar ? `<a href="#/leagues/${similar.id}" class="btn btn-dark">See a similar league: ${esc(similar.name)}</a>` : ""}
      <a href="#/leagues" class="btn btn-outline-dark">Back to League Selection</a>
    </div>`;
}

function reviewView(state, league, kind) {
  if (!league) return notFoundView("League not found");
  if (!takesIndividuals(league)) return teamsOnlyView(state, league);
  const existing = state.registrations.find((r) => r.leagueId === league.id);
  if (existing) return alreadyRegisteredView(league, existing);
  if (kind === "individual" && !canRegister(league)) return nowFullView(league);
  const waitlist = kind === "waitlist";

  return `
    ${stepHeader(league, kind, 1, waitlist ? "Join the waitlist" : "Review your registration")}
    ${partnerBanner(`Registration is handled by Soccer 7s (soccer7s.ca). In the next step you create your player account
      with them. You stay on this site the whole time, and you can come back to this step before you confirm.`)}
    ${summaryCard(league, kind)}
    <div class="d-grid gap-2 mt-4 account-form">
      <a href="#/${waitlist ? "waitlist" : "register"}/${league.id}/account" class="btn btn-dark btn-lg rounded-pill" id="continue-account">
        Continue to Step 2
      </a>
      <a href="#/leagues/${league.id}" class="btn btn-link link-dark">Go Back</a>
    </div>`;
}

function accountView(state, league, kind) {
  if (!league) return notFoundView("League not found");
  if (!takesIndividuals(league)) return teamsOnlyView(state, league);
  const { values, errors, sending, error } = state.form;
  const existing = state.registrations.find((r) => r.leagueId === league.id);
  if (existing) return alreadyRegisteredView(league, existing);
  if (kind === "individual" && !canRegister(league) && !sending) return nowFullView(league);
  const waitlist = kind === "waitlist";
  const base = `#/${waitlist ? "waitlist" : "register"}/${league.id}`;

  return `
    ${stepHeader(league, kind, 2, "Create your Soccer 7s account")}
    ${partnerBanner("")}
    <p class="mb-4">
      ${waitlist ? "Joining the waitlist for" : "Registering for"} <strong>${esc(league.name)}</strong> -
      ${formatDate(league.start)}, ${league.time} - ${esc(league.venue)} - ${money(league.indivPrice)} + tax
      <a href="${base}/review" class="link-dark ms-1">Change</a>
    </p>

    <form id="registration-form" class="account-form" novalidate>
      ${Object.keys(errors).length ? errorSummary(errors) : ""}
      ${error ? submitError(error, league) : ""}

      ${textField("name", "Full name", "text", "name", values.name, errors.name)}
      ${textField("email", "Email", "email", "email", values.email, errors.email, "Your confirmation is sent here.")}
      ${textField("password", "Password", "password", "new-password", values.password, errors.password, "At least 8 characters.")}
      ${spotField(league, kind, values.spot, errors.spot)}

      <div class="form-check mb-3">
        <input class="form-check-input ${errors.waiver ? "is-invalid" : ""}" type="checkbox" id="field-waiver" name="waiver"
          ${values.waiver ? "checked" : ""} ${errors.waiver ? 'aria-describedby="field-waiver-error"' : ""}>
        <label class="form-check-label" for="field-waiver">I accept the player waiver and league rules.</label>
        ${errors.waiver ? `<div class="invalid-feedback" id="field-waiver-error">${errors.waiver}</div>` : ""}
      </div>

      <div class="d-grid gap-2 mt-4">
        <button type="submit" class="btn btn-dark btn-lg rounded-pill" id="submit-registration" ${sending ? "disabled" : ""}>
          ${sending
            ? `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ${waitlist ? "Joining waitlist..." : "Registering..."}`
            : `Step 2 - ${waitlist ? "Join Waitlist" : "Confirm Registration"}`}
        </button>
        <a href="${base}/review" class="btn btn-link link-dark">Go Back</a>
      </div>
    </form>`;
}

function textField(name, label, type, autocomplete, value, error, hint) {
  const id = `field-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return `
    <div class="mb-3">
      <label for="${id}" class="form-label small fw-bold text-uppercase">${label}</label>
      <input type="${type}" class="form-control form-control-lg rounded-pill ${error ? "is-invalid" : ""}" id="${id}" name="${name}"
        value="${esc(value)}" autocomplete="${autocomplete}"
        ${describedBy ? `aria-describedby="${describedBy}"` : ""} ${error ? 'aria-invalid="true"' : ""}>
      ${error ? `<div class="invalid-feedback ps-3" id="${id}-error">${error}</div>` : ""}
      ${hint ? `<div class="form-text ps-3" id="${id}-hint">${hint}</div>` : ""}
    </div>`;
}

// Co-Ed leagues have separate male and female spots. A full spot type is
// disabled up front, with a link to the waitlist instead.
function spotField(league, kind, value, error) {
  const types = spotTypes(league);
  if (types.length === 1) return `<input type="hidden" name="spot" value="${types[0]}">`;

  const isFull = (t) => kind === "individual" && league.spots[t] === 0;
  const fullType = types.find(isFull);
  const radios = types.map((t) => `
    <div class="form-check">
      <input class="form-check-input" type="radio" name="spot" id="spot-${t}" value="${t}"
        ${value === t ? "checked" : ""} ${isFull(t) ? "disabled" : ""}>
      <label class="form-check-label" for="spot-${t}">
        ${SPOT_NAMES[t]}${kind === "waitlist" ? "" : isFull(t) ? " (full)" : ` (${league.spots[t]} left)`}
      </label>
    </div>`).join("");

  return `
    <fieldset class="mb-3" id="field-spot" ${error ? 'aria-describedby="field-spot-error"' : ""}>
      <legend class="form-label small fw-bold text-uppercase">Which individual spot are you registering for?</legend>
      <div class="form-text mt-0 mb-2">Co-Ed leagues keep separate spots for male and female players.</div>
      ${error ? `<div class="invalid-feedback d-block" id="field-spot-error">${error}</div>` : ""}
      ${radios}
      ${fullType ? `<div class="form-text">${SPOT_NAMES[fullType]} spots are full.
        <a href="#/waitlist/${league.id}/review" class="link-dark">Join the waitlist instead</a>.</div>` : ""}
    </fieldset>`;
}

function errorSummary(errors) {
  const keys = Object.keys(errors);
  return `
    <div class="alert alert-danger" id="error-summary" role="alert" tabindex="-1">
      <h2 class="h6">Fix ${plural(keys.length, "problem")} to continue</h2>
      <ul class="mb-0">
        ${keys.map((k) => `
          <li><a href="#field-${k}" class="alert-link" data-action="focus-field" data-target="field-${k}">${errors[k]}</a></li>`).join("")}
      </ul>
    </div>`;
}

// Errors from the service, each with a way to recover
function submitError(error, league) {
  const titles = { full: "That spot was just taken", duplicate: "You're already registered" };
  let action = `<button type="submit" class="btn btn-sm btn-dark" id="retry-registration">Try again</button>`;
  if (error.code === "full") {
    action = `<a href="#/waitlist/${league.id}/review" class="btn btn-sm btn-dark">Join the waitlist instead</a>`;
  } else if (error.code === "duplicate") {
    action = `<a href="#/leagues" class="btn btn-sm btn-dark">Back to League Selection</a>`;
  }
  return `
    <div class="alert alert-danger" id="submit-error" role="alert" tabindex="-1">
      <h2 class="h6">${titles[error.code] || "Your registration didn't go through"}</h2>
      <p>${esc(error.message)}${titles[error.code] ? "" : " Your details are still filled in below."}</p>
      ${action}
    </div>`;
}

/* ---------- Confirmation (end of task) ---------- */

function confirmationView(state, registration) {
  if (!registration) return notFoundView("Registration not found");
  const league = state.leagues.find((l) => l.id === registration.leagueId);
  const waitlist = registration.kind === "waitlist";

  return `
    <section class="confirm-panel confirmation">
      <div class="confirm-icon" aria-hidden="true">${waitlist ? "⏳" : "✓"}</div>
      ${pageTitle(waitlist ? "You're on the Waitlist!" : "You're Registered!")}
      <p class="fs-5 fw-semibold">${esc(league.name)} - Starts ${formatDate(league.start)} - ${esc(league.venue)}</p>
      <p class="fw-semibold">
        ${waitlist
          ? `You're #${registration.position} in line. We'll email ${esc(registration.email)} if a spot opens.`
          : `Confirmation email is on its way to ${esc(registration.email)}! (simulated)`}
      </p>
      <dl class="confirm-details mx-auto text-start my-4">
        ${fact("Confirmation", registration.id)}
        ${waitlist
          ? fact("Waiting for", `An individual ${registration.spot} spot`)
          : fact("Registered as", `Individual player (${registration.spot} spot)`)}
        ${waitlist
          ? fact("Charged", "Only if a spot opens for you")
          : fact("Amount due", `${money(league.indivPrice)} + tax (payment is simulated)`)}
      </dl>
      <div class="d-flex flex-wrap gap-2 justify-content-center">
        <a href="#/leagues" class="btn btn-dark">Back to League Selection</a>
        <a href="#/leagues/${league.id}" class="btn btn-outline-dark">View League</a>
      </div>
    </section>`;
}
