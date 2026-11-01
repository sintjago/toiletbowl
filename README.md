# Two projects

This repository holds two separate apps. They do not share an entry page, a runtime, or a data model.

| Folder | App | How to run |
| --- | --- | --- |
| [`toilet/`](toilet/) | TOILETBOWL — one closed-lid toilet in many art styles | `cd toilet && npm install && npm run dev` |
| [`matryoshka/`](matryoshka/) | Voxel nesting dolls you can open, unpack, and send home | `cd matryoshka && python3 -m http.server 8000` |

Do not merge the two apps into one `index.html`. To publish them as two GitHub repositories, use each folder as a repo root (`sintjago/toiletbowl` from `toilet/`, a new `sintjago/matryoshka` from `matryoshka/`).
