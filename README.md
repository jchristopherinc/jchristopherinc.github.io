# Reading statistics

`/books/` is built from a checked-in snapshot of Christopher's public Goodreads **read** shelf. Update it with:

```sh
python3 scripts/sync_goodreads.py
```

The sync script reads the public [Goodreads RSS feed](https://www.goodreads.com/review/list_rss/60658204?shelf=read) and downloads its supplied book cover image URLs into `assets/images/book-covers/`. Existing covers are not downloaded again. This avoids needing Playwright or scraping book pages as in the reference `generate-covers.js` script. Commit the generated `assets/data/books.json` and cover images when publishing a refreshed snapshot.

**Scope:** The RSS feed currently returns 44 entries. The normal Goodreads shelf and CSV export redirect to sign-in without an authenticated session. Do not assume the feed is a complete lifetime history. RSS does not provide shelf tags or language, so the page does not invent either. Missing read dates, publication years, and page counts are excluded from the corresponding charts, and a zero Goodreads user rating means *unrated*. To build a complete-history page, export Goodreads Library → Import and export → Export Library while signed in, then extend the data import with that file.
