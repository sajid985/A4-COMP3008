// Main controller: keeps the app state, handles user actions, calls the
// service and redraws the page whenever something changes.

const app = document.getElementById("app");
const announcer = document.getElementById("announcer");
const failToggle = document.getElementById("simulate-failure");

const state = {
  loading: true,
  loadFailed: false,
  leagues: [],
  registrations: [],
  filters: { ...NO_FILTERS },
  sort: "day",
  route: { name: "home" },
  form: newForm(),
};

let lastScreen = "";
let firstScreenShown = false;

function newForm(leagueId = null, kind = null) {
  return { leagueId, kind, values: {}, errors: {}, sending: false, error: null };
}

function setState(changes) {
  Object.assign(state, changes);
  render();
}

// Reads the address bar, example #/leagues/thu-coed-ra or #/register/thu-coed-ra/account
function getRoute() {
  const [page, id, step] = location.hash.replace(/^#\/?/, "").split("/");
  if (!page || page === "home") return { name: "home" };
  if (page === "leagues" && id) return { name: "details", leagueId: id };
  if ((page === "register" || page === "waitlist") && id) {
    return {
      name: step === "account" ? "account" : "review",
      leagueId: id,
      kind: page === "register" ? "individual" : "waitlist",
    };
  }
  if (page === "confirmation" && id) return { name: "confirmation", id };
  return { name: "catalogue" };
}

function currentView() {
  if (state.loading) return `<p class="text-muted py-5" id="loading-message">Loading leagues...</p>`;
  if (state.loadFailed) return loadErrorView();
  const route = state.route;
  const league = state.leagues.find((l) => l.id === route.leagueId);

  switch (route.name) {
    case "home": return homeView();
    case "details": return detailsView(state, league);
    case "review": return reviewView(state, league, route.kind);
    case "account": return accountView(state, league, route.kind);
    case "confirmation": return confirmationView(state, state.registrations.find((r) => r.id === route.id));
    default: return catalogueView(state);
  }
}

function render() {
  const focused = document.activeElement;
  const focusedId = focused && focused.id;
  const focusWasOnPage = app.contains(focused);
  app.innerHTML = currentView();
  updateNav();

  // The browser tab shows the heading of whatever is on screen
  const heading = document.getElementById("page-title");
  if (heading && !state.loading) {
    document.title = `${heading.textContent} - Ottawa Footy Sevens`;
  }

  const screen = location.hash + state.loading;
  if (screen !== lastScreen) {
    lastScreen = screen;
    if (!state.loading) {
      // New screen: go to the top and move focus to its heading, so keyboard
      // and screen reader users know the page changed. Not on the first load,
      // so the first Tab still reaches the "Skip to main content" link.
      window.scrollTo(0, 0);
      if (firstScreenShown) focusOn("page-title");
      firstScreenShown = true;
    }
  } else if (focusedId && document.getElementById(focusedId)) {
    // Same screen redrawn: keep focus where it was
    focusOn(focusedId);
  } else if (focusWasOnPage) {
    // The focused button is gone (e.g. a removed filter chip or a No Matches
    // suggestion), so move focus to a nearby heading instead of losing it
    focusOn(document.getElementById("results-title") ? "results-title" : "page-title");
  }
}

function updateNav() {
  // Underline the section the user is in, but only call it the current page
  // for screen readers when it really is that page
  const name = state.route.name;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const section = link.dataset.nav === "home" ? name === "home" : name !== "home";
    const exactPage = link.dataset.nav === "home" ? name === "home" : name === "catalogue";
    link.classList.toggle("active", section);
    if (exactPage) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Plain-text count of registrations and waitlist places in this browser
  const registered = state.registrations.filter((r) => r.kind === "individual").length;
  const waiting = state.registrations.length - registered;
  const parts = [];
  if (registered) parts.push(plural(registered, "registration"));
  if (waiting) parts.push(`${waiting} on a waitlist`);
  const count = document.getElementById("registration-count");
  count.hidden = parts.length === 0;
  count.textContent = parts.join(", ");
}

function focusOn(id) {
  const el = document.getElementById(id);
  if (el) el.focus();
}

// Screen readers read out whatever is put in the live region
function announce(message) {
  announcer.textContent = "";
  setTimeout(() => (announcer.textContent = message), 50);
}

function matchMessage() {
  const n = filterLeagues(state.leagues, state.filters).length;
  if (n === 0) return "No leagues match these filters.";
  return `${n} ${n === 1 ? "league matches" : "leagues match"}.`;
}

async function loadLeagues() {
  setState({ loading: true, loadFailed: false });
  let leagues;
  try {
    leagues = await getLeagues();
  } catch (err) {
    setState({ loading: false, loadFailed: true });
    return;
  }
  setState({ loading: false, leagues, registrations: getRegistrations() });
}

function onRouteChange() {
  const route = getRoute();
  let form = state.form;
  if (route.name === "review" || route.name === "account") {
    // Keep what the user typed when moving between the two steps,
    // but start a new form for a different league
    const sameForm = form.leagueId === route.leagueId && form.kind === route.kind;
    form = sameForm ? { ...form, errors: {}, error: null } : newForm(route.leagueId, route.kind);
  }
  setState({ route, form });
}

function setFilter(key, value) {
  setState({ filters: { ...state.filters, [key]: value } });
  announce(matchMessage());
}

function readForm(form) {
  const data = new FormData(form);
  return {
    name: data.get("name") || "",
    email: data.get("email") || "",
    password: data.get("password") || "",
    spot: data.get("spot") || "",
    waiver: data.get("waiver") === "on",
  };
}

async function submitRegistration(form) {
  if (state.form.sending) return; // ignore extra clicks while sending

  const { leagueId, kind } = state.route;
  const values = readForm(form);
  const errors = validateForm(values);

  if (Object.keys(errors).length > 0) {
    setState({ form: { ...state.form, values, errors, error: null } });
    focusOn("error-summary");
    return;
  }

  setState({ form: { ...state.form, values, errors: {}, error: null, sending: true } });
  announce("Sending your registration...");

  try {
    const registration = await registerPlayer(leagueId, kind, values);
    const leagues = await getLeagues(); // spot counts have changed
    setState({
      leagues,
      registrations: getRegistrations(),
      form: newForm(),
      route: { name: "confirmation", id: registration.id },
    });
    location.hash = `#/confirmation/${registration.id}`;
  } catch (err) {
    failToggle.checked = failNextRequest;
    const leagues = err.code === "full" ? await getLeagues() : state.leagues;
    setState({ leagues, form: { ...state.form, sending: false, error: { code: err.code, message: err.message } } });
    if (document.getElementById("submit-error")) {
      focusOn("submit-error");
    } else {
      // The whole form was replaced (e.g. the last spot went, so the page now
      // says the league is full): move focus to the new heading and say why
      focusOn("page-title");
      announce(err.message);
    }
  }
}

/* ---------- Event listeners ---------- */

app.addEventListener("change", (e) => {
  if (e.target.dataset.filter) {
    setFilter(e.target.dataset.filter, e.target.value);
  } else if (e.target.id === "sort-by") {
    setState({ sort: e.target.value });
    announce(`Sorted by ${e.target.selectedOptions[0].text.toLowerCase()}.`);
  }
});

// Remember typed values so they survive a redraw, without redrawing on every key
app.addEventListener("input", (e) => {
  const field = e.target;
  if (field.form && field.form.id === "registration-form" && field.name) {
    state.form.values[field.name] = field.type === "checkbox" ? field.checked : field.value;
  }
});

app.addEventListener("click", (e) => {
  const button = e.target.closest("[data-action]");
  if (button) {
    const action = button.dataset.action;
    if (action === "remove-filter") {
      setFilter(button.dataset.key, "");
    } else if (action === "clear-filters") {
      setState({ filters: { ...NO_FILTERS } });
      announce("Filters cleared. " + matchMessage());
    } else if (action === "reload") {
      loadLeagues();
    } else if (action === "focus-field") {
      e.preventDefault(); // stay on this screen instead of following the link
      const target = document.getElementById(button.dataset.target);
      const input = target.matches("input") ? target : target.querySelector("input:not([disabled])");
      input.focus();
    }
    return;
  }

  // Clicking anywhere on a league card opens that league
  const card = e.target.closest("[data-league-id]");
  if (card && !e.target.closest("a")) {
    location.hash = `#/leagues/${card.dataset.leagueId}`;
  }
});

app.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "registration-form") submitRegistration(e.target);
});

// The skip link moves focus without changing the page in the address bar
document.querySelector(".skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  focusOn("page-title");
});

failToggle.addEventListener("change", () => {
  failNextRequest = failToggle.checked;
});

document.getElementById("reset-demo").addEventListener("click", async () => {
  if (!confirm("Reset all demo registrations and spot counts?")) return;
  resetData();
  failNextRequest = false;
  failToggle.checked = false;
  state.filters = { ...NO_FILTERS };
  state.form = newForm();
  // Switch to League Selection first, so the old page isn't redrawn without its data
  state.route = { name: "catalogue" };
  location.hash = "#/leagues";
  await loadLeagues();
});

window.addEventListener("hashchange", onRouteChange);
onRouteChange(); // start on whatever page the address bar points to
loadLeagues();
