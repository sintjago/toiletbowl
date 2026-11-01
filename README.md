# Two projects

This repository holds two separate apps. They do not share an entry page, a runtime, or a data model.

| Folder | App | How to run |
| --- | --- | --- |
| [`toilet/`](toilet/) | TOILETBOWL — one closed-lid toilet in many art styles | `cd toilet && npm install && npm run dev` |
| [`matryoshka/`](matryoshka/) | Voxel nesting dolls you can open, unpack, and send home | `cd matryoshka && python3 -m http.server 8000` |

Do not merge the two apps into one `index.html`.

The dolls already have a history-only branch you can push into an empty GitHub repo:

```bash
git fetch origin cursor/matryoshka-export-1dd6
git push https://github.com/YOURUSER/matryoshka.git origin/cursor/matryoshka-export-1dd6:main
```

This agent can read and write `sintjago/toiletbowl` only. A new repo does not help until its URL is reachable from here, or until you run that push locally.
