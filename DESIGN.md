# Design notes

## Request cancellation and timeout

`src/searchController.ts` aborts the active request as soon as `setQuery` receives
new text. The next request starts only after the debounce delay. This ordering
closes the gap where an old response could arrive while the new text is waiting
for its debounce timer. Clearing the field follows the same path: it aborts the
active request and returns the UI to its idle state without starting a request.

Each request has a fresh `AbortController`. The controller combines its signal
with an eight-second timeout signal through `AbortSignal.any`. The fetch receives
the combined signal, so both a new input and a timeout can cancel network work.
`AbortError` means the user replaced or cleared the query and is ignored by the
UI. `TimeoutError`, `HttpError`, and network failures are classified separately
and shown as retryable errors. A 404 is converted to an empty list in
`src/searchCountries.ts`, so it becomes the friendly “no country found” state.

The controller also checks that a response still belongs to the active query
before updating state. This guards the small boundary where a response may have
completed just as cancellation was requested; it supplements actual aborting
and does not replace it.

The cache and in-flight deduplication live in `src/countryRepository.ts`. The
repository gives each caller its own abort signal and maintains a separate
controller for the shared fetch. Cancelling one caller rejects only that
caller's promise. The shared request is aborted only when every caller has
cancelled.

## Debounce delay

`src/searchController.ts` uses a 350 ms delay. This is long enough to combine
most pauses between keystrokes into one request, while keeping search responsive
after the user finishes typing. Without debounce, typing a country name sends a
request for every intermediate prefix. A much longer delay would save a few more
requests but make the search feel slow after each edit.

The debounce helper in `src/debounce.ts` owns only the timer and invokes the
callback with the latest arguments. The controller separately handles request
cancellation because cancellation must happen immediately on input, not when
the delayed callback eventually runs.

## Complexity

`mapCountryResponse` in `src/mapCountryResponse.ts` makes a fixed number of
passes over nested language, currency, and border values. If their combined
length is `n`, time complexity is **O(n)** and the mapped arrays use **O(n)**
additional space. The remaining field lookups take constant time.

The cache and in-flight maps in `src/countryRepository.ts` use JavaScript
`Map`, with average **O(1)** lookup and insertion by normalized query key. Key
normalization takes **O(q)** for a query of length `q`. Storing a response takes
**O(r)** space for its `r` country records. Each active caller adds one promise
continuation and one abort listener; cancelling all consumers takes **O(c)**
over `c` active callers only when their signals fire individually.

## Clean-code choices

- Single responsibilities are kept in separate modules: request handling in
  `searchCountries.ts`, response mapping in `mapCountryResponse.ts`, debounce
  in `debounce.ts`, error classification in `requestError.ts`, shared caching in
  `countryRepository.ts`, and DOM rendering in `main.ts` and
  `countryDetailsView.ts`.
- `mapCountryResponse` is a pure transformation and is tested with sample
  objects, without fetch or browser setup.
- Errors use `HttpError` and named abort reasons instead of string matching.
  The user-facing branches are in `searchController.ts` and `main.ts`.
- Dynamic text is assigned with `textContent`, and elements are created with
  DOM APIs. API data is never inserted with `innerHTML`.
- Browser storage is isolated in `searchHistory.ts`; malformed or unavailable
  storage does not stop the search UI.
- Tests use fake timers and mocked fetches. The race test's fetch mock listens
  to the supplied signal and rejects with `AbortError` when that signal aborts.

## Manual behavior checklist

Complete this checklist against the deployed page before submitting the PR:

- [ ] Empty input sends no request and shows no results.
- [ ] Loading state is visible while a request is pending.
- [ ] Fast typing never displays an older query's results.
- [ ] Superseded requests appear cancelled in the browser Network panel.
- [ ] User-triggered cancellation is not shown as an error.
- [ ] A 404 shows a friendly no-results message.
- [ ] A real network or server error shows a retry button; retry uses the same query.
- [ ] Selecting a country opens its detail view and Back returns to the results.
- [ ] Recent searches survive a page reload and can be selected to search again.
