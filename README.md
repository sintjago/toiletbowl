# Two projects

This repository holds two separate apps. They do not share an entry page, a runtime, or a data model.

| Folder | App | How to run |
| --- | --- | --- |
| [`toilet/`](toilet/) | TOILETBOWL — one closed-lid toilet in many art styles | `cd toilet && npm install && npm run dev` |
| [`matryoshka/`](matryoshka/) | Voxel nesting dolls you can open, unpack, and send home | `cd matryoshka && python3 -m http.server 8000` |

Do not merge the two apps into one `index.html`.

The empty public repo is [sintjago/matryoshka](https://github.com/sintjago/matryoshka). A dolls-only history is on `cursor/matryoshka-export-1dd6`. This agent can read that repo but cannot push (Cursor’s GitHub app has no write access there). Publish it from your machine:

```bash
git fetch origin cursor/matryoshka-export-1dd6
git push https://github.com/sintjago/matryoshka.git origin/cursor/matryoshka-export-1dd6:main
```
