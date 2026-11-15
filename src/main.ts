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
const searchInput = createElement('input', 'search-input');
searchInput.type = 'search';
searchInput.name = 'country';
searchInput.autocomplete = 'off';
searchInput.placeholder = 'Try “Portugal” or “Japan”';
searchInput.setAttribute('aria-label', 'Search countries by name');
const searchHint = createElement('p', 'search-hint');
searchHint.textContent = 'Search updates as you type';
searchForm.append(searchInput, searchHint);

content.append(eyebrow, title, description, searchForm);

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
