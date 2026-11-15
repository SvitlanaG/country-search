import { createCountryDetailsView } from './countryDetailsView';
import type { Country } from './mapCountryResponse';
import { createSearchController, type SearchState } from './searchController';

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  return element;
}

const app = createElement('main', 'app-shell');
const header = createElement('header', 'topbar');
const brand = createElement('a', 'brand');
brand.href = '#top';
brand.setAttribute('aria-label', 'Atlas home');

const brandMark = createElement('span', 'brand-mark');
brandMark.setAttribute('aria-hidden', 'true');
brandMark.textContent = '✳';
const brandName = createElement('span', 'brand-name');
brandName.textContent = 'atlas';
brand.append(brandMark, brandName);

const headerNote = createElement('span', 'header-note');
headerNote.textContent = 'A field guide to the world';
header.append(brand, headerNote);

const content = createElement('section', 'content');
content.id = 'top';

const eyebrow = createElement('p', 'eyebrow');
eyebrow.textContent = 'DISCOVER THE WORLD';
const title = createElement('h1', 'hero-title');
title.append('Every country, ');
const titleAccent = createElement('span', 'title-accent');
titleAccent.textContent = 'one search away.';
title.append(titleAccent);
const description = createElement('p', 'hero-copy');
description.textContent =
  'Find a place and get to know the details that make it unique.';

const searchForm = createElement('form', 'search-form');
searchForm.setAttribute('role', 'search');
searchForm.addEventListener('submit', (event) => event.preventDefault());
const searchShell = createElement('div', 'search-shell');
const searchInput = createElement('input', 'search-input');
searchInput.type = 'search';
searchInput.name = 'country';
searchInput.autocomplete = 'off';
searchInput.placeholder = 'Try “Portugal” or “Japan”';
searchInput.setAttribute('aria-label', 'Search countries by name');
const clearButton = createElement('button', 'clear-button');
clearButton.type = 'button';
clearButton.textContent = '×';
clearButton.setAttribute('aria-label', 'Clear search');
clearButton.hidden = true;
searchShell.append(searchInput, clearButton);
const searchHint = createElement('p', 'search-hint');
searchHint.textContent = 'Search updates as you type';
searchForm.append(searchShell, searchHint);

const status = createElement('p', 'search-status');
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
const results = createElement('section', 'results');
results.setAttribute('aria-label', 'Country search results');

content.append(eyebrow, title, description, searchForm, status, results);

const footer = createElement('footer', 'footer');
const footerLabel = createElement('span');
footerLabel.textContent = 'Country data';
const footerLink = createElement('a');
footerLink.href = 'https://countries.dev';
footerLink.target = '_blank';
footerLink.rel = 'noreferrer';
footerLink.textContent = 'countries.dev';
footer.append(footerLabel, footerLink);

app.append(header, content, footer);
document.body.append(app);

function formattedPopulation(population: number): string {
  return new Intl.NumberFormat('en').format(population);
}

function createCountryCard(country: Country): HTMLButtonElement {
  const card = createElement('button', 'country-card');
  card.type = 'button';
  card.setAttribute('aria-label', `View details for ${country.name}`);
  const top = createElement('span', 'country-card-top');
  const flag = createElement('span', 'country-flag');

  if (/^https?:\/\//i.test(country.flag)) {
    const image = createElement('img');
    image.src = country.flag;
    image.alt = `${country.name} flag`;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      flag.replaceChildren();
      flag.textContent = country.emoji || '🌐';
    });
    flag.append(image);
  } else {
    flag.textContent = country.flag || country.emoji || '🌐';
    flag.setAttribute('aria-label', `${country.name} flag`);
  }

  const arrow = createElement('span', 'country-card-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  top.append(flag, arrow);

  const name = createElement('span', 'country-name');
  name.textContent = country.name;
  const capital = createElement('span', 'country-capital');
  capital.textContent = country.capital;
  const metadata = createElement('span', 'country-metadata');
  const region = createElement('span');
  region.textContent = country.region;
  const population = createElement('span');
  population.textContent = `${formattedPopulation(country.population)} people`;
  metadata.append(region, population);

  card.append(top, name, capital, metadata);
  card.addEventListener('click', () => {
    selectedCountry = country;
    renderState(currentState);
  });
  return card;
}

let selectedCountry: Country | undefined;
let currentState: SearchState = { kind: 'idle', query: '', countries: [] };

function renderState(state: SearchState): void {
  currentState = state;
  results.setAttribute(
    'aria-busy',
    state.kind === 'loading' ? 'true' : 'false',
  );
  results.replaceChildren();

  if (selectedCountry && state.kind === 'results') {
    status.textContent = 'COUNTRY PROFILE';
    results.append(
      createCountryDetailsView(selectedCountry, () => {
        selectedCountry = undefined;
        renderState(currentState);
      }),
    );
    return;
  }

  if (state.kind === 'idle') {
    status.textContent = '';
    const welcome = createElement('div', 'empty-state');
    const welcomeTitle = createElement('h2');
    welcomeTitle.textContent = 'The world is a big place.';
    const welcomeCopy = createElement('p');
    welcomeCopy.textContent =
      'Start with a country name and explore from there.';
    welcome.append(welcomeTitle, welcomeCopy);
    results.append(welcome);
    return;
  }

  if (state.kind === 'loading') {
    status.textContent = 'SEARCHING';
    const loading = createElement('div', 'loading-state');
    const spinner = createElement('span', 'spinner');
    spinner.setAttribute('aria-hidden', 'true');
    const label = createElement('p');
    label.textContent = `Looking for ${state.query}…`;
    loading.append(spinner, label);
    results.append(loading);
    return;
  }

  if (state.kind === 'not-found') {
    status.textContent = 'NO MATCHES';
    const empty = createElement('div', 'empty-state');
    const emptyTitle = createElement('h2');
    emptyTitle.textContent = 'No country found';
    const emptyCopy = createElement('p');
    emptyCopy.textContent = `We couldn’t find “${state.query}”. Try another spelling.`;
    empty.append(emptyTitle, emptyCopy);
    results.append(empty);
    return;
  }

  if (state.kind === 'error') {
    status.textContent = 'SEARCH INTERRUPTED';
    const errorCard = createElement('div', 'error-state');
    const errorTitle = createElement('h2');
    errorTitle.textContent = 'That search didn’t go through';
    const errorCopy = createElement('p');
    errorCopy.textContent =
      state.error === 'timeout'
        ? 'The request took too long. Check your connection and try again.'
        : state.error === 'http'
          ? 'The country service returned an error. Please try again.'
          : 'We couldn’t reach the country service. Check your connection and try again.';
    const retry = createElement('button', 'retry-button');
    retry.type = 'button';
    retry.textContent = 'Try again  ↗';
    retry.addEventListener('click', () => searchController.retry());
    errorCard.append(errorTitle, errorCopy, retry);
    results.append(errorCard);
    return;
  }

  status.textContent = `${state.countries.length} COUNTRIES FOUND`;
  const grid = createElement('div', 'country-grid');
  for (const country of state.countries)
    grid.append(createCountryCard(country));
  results.append(grid);
}

const searchController = createSearchController(renderState);

searchInput.addEventListener('input', () => {
  selectedCountry = undefined;
  clearButton.hidden = searchInput.value.length === 0;
  searchController.setQuery(searchInput.value);
});

clearButton.addEventListener('click', () => {
  searchInput.value = '';
  selectedCountry = undefined;
  clearButton.hidden = true;
  searchController.setQuery('');
  searchInput.focus();
});

renderState({ kind: 'idle', query: '', countries: [] });
