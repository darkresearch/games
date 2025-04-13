# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Docker Deployment

The application is containerized using Bun, a fast JavaScript runtime and package manager.

### Using Docker Compose (recommended)

1. Set your faucet private key as an environment variable:

   ```bash
   export FAUCET_PRIVATE_KEY=your_private_key_here
   ```

2. Build and run the container:
   ```bash
   docker-compose up -d
   ```

### Using Docker directly

1. Build the Docker image:

   ```bash
   docker build -t dfarena-faucet:bun .
   ```

2. Run the container:
   ```bash
   docker run -d -p 3000:3000 -e FAUCET_PRIVATE_KEY=your_private_key_here dfarena-faucet:bun
   ```

The application will be available at http://localhost:3000.
