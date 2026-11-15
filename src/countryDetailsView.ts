import type { Country } from './mapCountryResponse';

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  return element;
}

function detailRow(label: string, value: string): HTMLDivElement {
  const row = createElement('div', 'detail-row');
  const key = createElement('dt', 'detail-label');
  key.textContent = label;
  const description = createElement('dd', 'detail-value');
  description.textContent = value;
  row.append(key, description);
  return row;
}

export function createCountryDetailsView(
  country: Country,
  onBack: () => void,
): HTMLElement {
  const view = createElement('article', 'detail-view');
  const backButton = createElement('button', 'back-button');
  backButton.type = 'button';
  backButton.textContent = '←  Back to results';
  backButton.addEventListener('click', onBack);

  const heading = createElement('header', 'detail-heading');
  const flag = createElement('span', 'detail-flag');
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

  const titleBlock = createElement('div');
  const code = createElement('p', 'eyebrow');
  code.textContent = country.code || country.region.toUpperCase();
  const title = createElement('h2', 'detail-title');
  title.textContent = country.name;
  const subtitle = createElement('p', 'detail-subtitle');
  subtitle.textContent = [country.subregion, country.region]
    .filter(Boolean)
    .join(' · ');
  titleBlock.append(code, title, subtitle);
  heading.append(flag, titleBlock);

  const description = createElement('p', 'detail-description');
  const location = country.subregion || country.region.toLowerCase();
  description.textContent = `${country.name} is in ${location}. Its capital is ${country.capital}.`;

  const facts = createElement('dl', 'detail-facts');
  const format = (value: number) => new Intl.NumberFormat('en').format(value);
  facts.append(
    detailRow('Capital', country.capital),
    detailRow('Region', country.region),
    detailRow('Population', format(country.population)),
    detailRow(
      'Area',
      country.area === null ? 'Not listed' : `${format(country.area)} km²`,
    ),
    detailRow('Languages', country.languages.join(', ') || 'Not listed'),
    detailRow('Currency', country.currency),
    detailRow('Native name', country.nativeName || 'Not listed'),
    detailRow(
      'Borders',
      country.borders.join(', ') || 'No land borders listed',
    ),
  );

  view.append(backButton, heading, description, facts);
  return view;
}
