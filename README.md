# gf-server-docs

Public documentation site for the server data files, built with MkDocs Material.

Only the files listed in `manifest.json` are published. `publish.py` copies them from the private notes folder
into `docs/`, applies the replacement map, and refuses to publish any file that still matches a deny pattern
(server names, IP addresses, internal paths, internal note references).

## Publish a new or updated article

1. Add the source file to `manifest.json` (`src` = file name inside the notes folder, `dst` = path under `docs/`).
2. Add it to `nav` in `mkdocs.yml` and to the table in `docs/index.md`.
3. Run:

```bash
python publish.py
```

```bash
mkdocs build --strict
```

`mkdocs serve` previews the site at http://127.0.0.1:8000. `mkdocs gh-deploy` publishes it to GitHub Pages.

## Setup

```bash
pip install -r requirements.txt
```

## Local configuration

`manifest.json` is git-ignored because it holds the local path of the private notes and the deny list.
Copy `manifest.example.json` to `manifest.json` and fill it in on each machine that publishes.
