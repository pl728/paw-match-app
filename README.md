## Directory Structure
```
paw-match/
├── backend/                 # Express.js server
├── frontend/                # React application
├── .github/                 # GitHub configuration (issues, workflows)
│   ├── workflows/           # CI workflows
│   └── ISSUE_TEMPLATE/      # Issue templates and config
└── .gitignore               # Git ignore rules
```

Run `npm install` in `backend/` and `frontend/` directories separately to install dependencies.

For backend + MySQL setup (Docker, WSL/Ubuntu, macOS), see `backend/README.md`.

### Database - Entity-Relationship Diagram:

<img width="1099" height="1065" alt="image" src="https://github.com/user-attachments/assets/a389cd6e-20d7-42fb-bcbf-2e375ee77b6f" />
