**DO NOT push features/code directly to `main`!**
All changes must be made via pull requests from feature branches.

### Workflow:
1. Create a branch: `git checkout -b your-name-feature-name`
2. Make your changes and commit
3. Push your branch: `git push -u origin your-name-feature-name`
4. Open a Pull Request on GitHub
5. Get review, then merge

**Branch naming:** `osuid/feature-description` (e.g., `linpatr/hello-world`)

## Directory Structure
```
paw-match/
├── backend/     # Express.js server
├── frontend/    # React application (TBD)
└── .gitignore   # Ignores node_modules/ for both frontend and backend
```

Run `npm install` in `backend/` and `frontend/` directories separately to install dependencies.
