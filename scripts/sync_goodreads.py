#!/usr/bin/env python3
"""Snapshot Christopher's public Goodreads read shelf and its cover images.

Run: python3 scripts/sync_goodreads.py
The public RSS feed is a snapshot source, not a complete Goodreads CSV export.
"""
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEED = "https://www.goodreads.com/review/list_rss/60658204?shelf=read"
DATA = ROOT / "assets" / "data" / "books.json"
COVERS = ROOT / "assets" / "images" / "book-covers"


def text(item, path):
    return (item.findtext(path) or "").strip()


def read_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%a, %d %b %Y %H:%M:%S %z").date().isoformat()
    except ValueError:
        return None


def number(value, kind: type[int] | type[float] = int) -> int | float | None:
    try:
        return kind(value)
    except (TypeError, ValueError):
        return None


def parse_feed(payload):
    root = ET.fromstring(payload)
    channel = root.find("channel")
    if channel is None or text(channel, "title") != "Christopher's bookshelf: read":
        raise ValueError("Unexpected Goodreads feed; refusing to replace the snapshot")
    books = []
    seen = set()
    for item in channel.findall("item"):
        book_id = text(item, "book_id")
        if not re.fullmatch(r"\d+", book_id) or book_id in seen:
            raise ValueError("Invalid or duplicate Goodreads book ID")
        seen.add(book_id)
        title = text(item, "title")
        if not title:
            raise ValueError("Book without a title")
        books.append({
            "id": book_id,
            "title": title,
            "author": text(item, "author_name") or "Unknown author",
            "rating": number(text(item, "user_rating")),
            "averageRating": number(text(item, "average_rating"), float),
            "pages": number(text(item, "book/num_pages")),
            "published": number(text(item, "book_published")),
            "dateRead": read_date(text(item, "user_read_at")),
            "coverSource": text(item, "book_large_image_url"),
        })
    if not books:
        raise ValueError("Empty feed; refusing to replace the snapshot")
    return books


def request(url):
    if not url.startswith("https://"):
        raise ValueError("Only HTTPS sources are supported")
    # curl uses the system trust store; some Python.org macOS installs lack a CA bundle.
    return subprocess.run(
        ["curl", "--fail", "--location", "--silent", "--show-error", "--max-time", "35", url],
        check=True, capture_output=True,
    ).stdout


def main():
    books = parse_feed(request(FEED))
    COVERS.mkdir(parents=True, exist_ok=True)
    saved = 0
    for book in books:
        source = book.pop("coverSource")
        target = COVERS / (book["id"] + ".jpg")
        if target.exists() and target.stat().st_size:
            book["cover"] = f"/assets/images/book-covers/{book['id']}.jpg"
        elif source and source.startswith("https://i.gr-assets.com/"):
            try:
                image = request(source)
                if len(image) < 100 or image[:3] != b"\xff\xd8\xff":
                    raise ValueError("Response is not a JPEG")
                target.write_bytes(image)
                book["cover"] = f"/assets/images/book-covers/{book['id']}.jpg"
                saved += 1
            except (OSError, ValueError, subprocess.CalledProcessError) as exc:
                print(f"Cover unavailable for {book['id']}: {exc}", file=sys.stderr)
        if "cover" not in book:
            book["cover"] = None
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps({"source": FEED, "books": books}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(books)} books and {saved} new covers to {DATA}")


if __name__ == "__main__":
    main()
