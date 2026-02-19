# Building a static app and serving it in GitHub

## Setup

```sh
# Use a stable version of node
nvm use 22
# create a new project
npx sv create contactsheet
# Run the project
npm run dev
# View it in the browser at http://localhost:5173/
```

## How to build a static version

1. We need to add a file to src/routes to stop prerendering and server side rendering

+layout.ts

```javascript
export const prerender = true;
export const ssr = false;
```

2. If we try to run a build we get the following error

> Could not detect a supported production environment. See https://svelte.dev/docs/kit adapters to learn how to configure your app to run on the platform of your choosing

We need to let SvelteKit know what it is building when we run `npm run build`

This is done in svelte.config.json, the original file looks like this

```json
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
```

We first need to install the static builder

```sh
# make sure we're using the right version of node
nvm use 22
# Install the builder as a dev dependency
npm install -D @sveltejs/adapter-static
```

We should now see this in package.json - `"@sveltejs/adapter-static": "^3.0.10" `

The svelte.config.json file can now be updated

```json
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {

		// Use the static adapter (no Node server required).
		// This builds the site into plain HTML, CSS, and JS files.
		adapter: adapter({

			// Output directory for generated HTML pages
			// (e.g. index.html, about/index.html, etc.)
			pages: 'docs',

			// Output directory for static assets (JS, CSS, images)
			// Usually kept the same as pages for GitHub Pages
			assets: 'docs',

			// Generate a single fallback file for client-side routing.
			// Required for SPAs deployed to static hosting
			// (e.g. GitHub Pages) so deep links don't 404.
			fallback: 'index.html'
		}),

		paths: {

			// Base path the app will be served from.
			// This is essential if deploying to:
			// https://username.github.io/contactsheet/
			// instead of the domain root.
			base: '/contactsheet'
		}
	}
};

export default config;
```

## Why docs?

A `docs` folder is one of the places in a repository that github can serve a static site from.

## Lets update the page and run a build

Update src/routes/+page.svelte

```html
<h1>Welcome to Contactsheet</h1>
```

The dev page over at http://localhost:5173/contactsheet/ should have updated automatically if `npm run dev` is still running in the terminal

## Run a static build

At the moment there is no docs folder, running `npm run build` will change that

Once built it can be previewed using `npm run preview`, this is just a tool that serves a static site.

## Serving it on GitHub pages

Github Pages uses Jekyll for hosting the static sites from either the root of the Repository, or a docs folder. We have set up the build to build into the docs folder.

There is however a gotcha to be avoided, the Svelte build process generates a folder named `_app`. If you've used Jekyll before you may know that files and folders that start with an underscore are considered special, they are not copied to the output folder.

To fix this we include a postbuild script in the package.json that will automatically run after the build

Add this to the scripts block

```json
"postbuild": "touch docs/.nojekyll",
```

It will add a .nojekyll file to the docs folder that disables jekylls rendering engine.

## Setup on github

```sh
git init
git add -A
git commit -m"Initial commit"
```

In Github create a new repo

```

```
