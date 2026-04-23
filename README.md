# Gift Shop Backend

Node.js/Express and MongoDB/Mongoose backend for the Gift Shop project. The current scope is backend-only and includes auth, products, categories, cart, orders and image upload modules.

## Project Workflow

- Contribution rules: [CONTRIBUTING.md](CONTRIBUTING.md)
- Gitflow and QA uplift branch map: [docs/gitflow.md](docs/gitflow.md)

## Environment

Create a local `.env` file from [.env.example](.env.example). Do not commit secrets or real credentials.

## Scripts

- `npm run dev` starts the API with `nodemon`.
- `npm start` starts the API with Node.js.
- `npm test` is intentionally not available yet; API automation will be added in the `test/api-automation` branch.
