(() => {
  'use strict';
  const root = document.querySelector('.reading');
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const format = new Intl.NumberFormat('en');
  let books = [];
  let filter = 'all';
  const number = (n) => format.format(n);
  const validDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const year = (book) => validDate(book.dateRead) ? Number(book.dateRead.slice(0, 4)) : null;
  const rating = (book) => Number.isInteger(book.rating) && book.rating >= 1 && book.rating <= 5 ? book.rating : 0;
  const sorted = (items, compare) => [...items].sort(compare);
  const byLabel = (a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'});
  const link = (book) => `https://www.goodreads.com/book/show/${encodeURIComponent(book.id)}`;

  function barChart(id, entries, unit = '') {
    const node = $(id);
    node.replaceChildren();
    if (!entries.length) { node.textContent = 'No recorded data for this chart.'; return; }
    const max = Math.max(...entries.map(([, value]) => value), 1);
    for (const [label, value] of entries) {
      const row = document.createElement('div');
      row.className = 'reading-bar';
      const name = document.createElement('span');
      name.className = 'reading-bar__name'; name.textContent = label;
      const track = document.createElement('span');
      track.className = 'reading-bar__track';
      const fill = document.createElement('span');
      fill.className = 'reading-bar__fill'; fill.style.width = `${value / max * 100}%`;
      track.append(fill);
      const valueLabel = document.createElement('strong');
      valueLabel.textContent = `${number(value)}${unit}`;
      row.append(name, track, valueLabel);
      node.append(row);
    }
  }
  function grouped(items, key) {
    const result = new Map();
    for (const item of items) {
      const label = key(item);
      if (label != null) result.set(label, (result.get(label) || 0) + 1);
    }
    return result;
  }
  function timeline(dated) {
    const node = $('reading-timeline');
    node.replaceChildren();
    if (!dated.length) { node.textContent = 'No read dates have been recorded.'; return; }
    const years = sorted([...new Set(dated.map(year))], (a, b) => a - b);
    const table = document.createElement('div'); table.className = 'timeline-table';
    for (const y of years) {
      const row = document.createElement('div'); row.className = 'timeline-row';
      const label = document.createElement('span'); label.className = 'timeline-year'; label.textContent = y;
      const lane = document.createElement('div'); lane.className = 'timeline-lane';
      const counts = new Map();
      for (const book of dated.filter((b) => year(b) === y)) {
        const month = Number(book.dateRead.slice(5, 7)) - 1;
        const day = Number(book.dateRead.slice(8, 10));
        const slot = Math.min(11, Math.max(0, month));
        const used = counts.get(slot) || 0; counts.set(slot, used + 1);
        const dot = document.createElement('a');
        dot.href = link(book); dot.className = `timeline-dot timeline-dot--${rating(book)}`;
        dot.style.left = `calc(${((month + (day - 1) / 31) / 12 * 100).toFixed(2)}% - 5px)`;
        dot.style.top = `${5 + (used % 4) * 13}px`;
        dot.setAttribute('aria-label', `${book.title}, read ${book.dateRead}, ${rating(book) ? `${rating(book)} out of 5 stars` : 'unrated'}`);
        dot.title = `${book.title} · ${book.dateRead} · ${rating(book) ? `${rating(book)}★` : 'unrated'}`;
        lane.append(dot);
      }
      row.append(label, lane); table.append(row);
    }
    node.append(table);
    const months = document.createElement('div'); months.className = 'timeline-months';
    for (const name of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      const span = document.createElement('span'); span.textContent = name; months.append(span);
    }
    node.append(months);
  }
  function stats() {
    const dated = books.filter((b) => year(b) !== null);
    $('stat-books').textContent = number(books.length);
    $('stat-authors').textContent = number(new Set(books.map((b) => b.author)).size);
    $('stat-pages').textContent = number(books.reduce((sum, b) => sum + (b.pages > 0 ? b.pages : 0), 0));
    $('stat-years').textContent = number(new Set(dated.map(year)).size);
    timeline(dated);
    const years = sorted([...new Set(dated.map(year))], (a, b) => a - b);
    barChart('books-by-year', years.map((y) => [String(y), dated.filter((b) => year(b) === y).length]));
    barChart('pages-by-year', years.map((y) => [String(y), dated.filter((b) => year(b) === y).reduce((n, b) => n + (b.pages > 0 ? b.pages : 0), 0)]));
    const ratings = grouped(books, rating);
    barChart('ratings-chart', [5, 4, 3, 2, 1, 0].filter((n) => ratings.has(n)).map((n) => [n ? `${n} ★` : 'Unrated', ratings.get(n)]));
    const periods = grouped(books, (b) => b.published > 0 ? `${Math.floor(b.published / 10) * 10}s` : null);
    barChart('published-chart', sorted([...periods], (a, b) => byLabel(a[0], b[0])));
    const lengths = [['Under 200', (b) => b.pages > 0 && b.pages < 200], ['200–399', (b) => b.pages >= 200 && b.pages < 400], ['400–599', (b) => b.pages >= 400 && b.pages < 600], ['600+', (b) => b.pages >= 600]];
    barChart('length-chart', lengths.map(([label, predicate]) => [label, books.filter(predicate).length]));
    const authors = [...grouped(books, (b) => b.author)].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || byLabel(a[0], b[0]));
    const list = $('reading-authors'); list.replaceChildren();
    if (!authors.length) { list.textContent = 'No repeat authors on this shelf yet.'; }
    for (const [author, count] of authors) {
      const row = document.createElement('div'); row.className = 'author-row';
      const name = document.createElement('strong'); name.textContent = author;
      const titles = document.createElement('span'); titles.textContent = books.filter((b) => b.author === author).map((b) => b.title).join(' · ');
      const total = document.createElement('b'); total.textContent = `${count} books`;
      row.append(name, titles, total); list.append(row);
    }
  }
  function filters() {
    const node = $('rating-filters'); node.replaceChildren();
    const values = ['all', 5, 4, 3, 2, 1, 0].filter((v) => v === 'all' || books.some((b) => rating(b) === v));
    for (const value of values) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = value === 'all' ? 'All books' : value === 0 ? 'Unrated' : `${value} ★`;
      button.setAttribute('aria-pressed', String(filter === value));
      button.addEventListener('click', () => { filter = value; filters(); renderBooks(); });
      node.append(button);
    }
  }
  function renderBooks() {
    const search = $('book-search').value.trim().toLocaleLowerCase();
    const items = books.filter((b) => (filter === 'all' || rating(b) === filter) && `${b.title} ${b.author}`.toLocaleLowerCase().includes(search));
    const mode = $('book-sort').value;
    const compare = mode === 'recent' ? (a, b) => (b.dateRead || '').localeCompare(a.dateRead || '') || byLabel(a.title, b.title)
      : mode === 'title' ? (a, b) => byLabel(a.title, b.title)
      : mode === 'author' ? (a, b) => byLabel(a.author, b.author) || byLabel(a.title, b.title)
      : (a, b) => rating(b) - rating(a) || (b.averageRating || 0) - (a.averageRating || 0) || byLabel(a.title, b.title);
    $('reading-count').textContent = `${number(items.length)} of ${number(books.length)} books`;
    const grid = $('book-grid'); grid.replaceChildren();
    if (!items.length) { const empty = document.createElement('p'); empty.textContent = 'No books match these filters.'; grid.append(empty); return; }
    for (const book of sorted(items, compare)) {
      const card = document.createElement('article'); card.className = 'book-card';
      const anchor = document.createElement('a'); anchor.href = link(book); anchor.className = 'book-card__cover';
      anchor.setAttribute('aria-label', `${book.title} on Goodreads`);
      if (book.cover && /^\/assets\/images\/book-covers\/\d+\.jpg$/.test(book.cover)) {
        const image = document.createElement('img'); image.src = `${root.dataset.coverBase}${book.id}.jpg`;
        image.alt = ''; image.loading = 'lazy'; image.width = 160; image.height = 236;
        anchor.append(image);
      } else { const missing = document.createElement('span'); missing.textContent = 'Cover unavailable'; anchor.append(missing); }
      const details = document.createElement('div'); details.className = 'book-card__details';
      const heading = document.createElement('h3'); const title = document.createElement('a'); title.href = link(book); title.textContent = book.title; heading.append(title);
      const author = document.createElement('p'); author.className = 'book-card__author'; author.textContent = book.author;
      const meta = document.createElement('p'); meta.className = 'book-card__meta';
      meta.textContent = `${rating(book) ? `${rating(book)} ★ my rating` : 'Unrated'} · ${book.pages > 0 ? `${number(book.pages)} pages` : 'Pages unknown'}`;
      details.append(heading, author, meta);
      if (validDate(book.dateRead)) {
        const date = document.createElement('p'); date.className = 'book-card__date'; date.textContent = `Read ${book.dateRead}`;
        details.append(date);
      }
      card.append(anchor, details); grid.append(card);
    }
  }
  fetch(root.dataset.booksUrl).then((response) => { if (!response.ok) throw new Error('Snapshot unavailable'); return response.json(); })
    .then((data) => {
      if (!Array.isArray(data.books) || !data.books.length) throw new Error('Empty snapshot');
      books = data.books; stats(); filters(); renderBooks();
      $('reading-content').hidden = false; $('reading-status').hidden = true;
      $('book-search').addEventListener('input', renderBooks);
      $('book-sort').addEventListener('change', renderBooks);
    })
    .catch(() => { $('reading-status').textContent = 'The reading log is unavailable right now. You can still browse my shelf on Goodreads.'; });
})();
