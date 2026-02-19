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

## Development versus a production build

- `npm run dev` starts a local development server with hot reloading and on-the-fly compilation so you can see changes instantly while coding.
- `npm run build` creates an optimized production bundle (and prerendered pages if configured) ready to deploy.

## How to build a static version

1. Though not strictly required, we can add a file to src/routes to stop prerendering and server side rendering

This

- Prevents SSR warnings
- Ensures your build behaves the same as production
- Avoids surprises later

**prerender** = true tells SvelteKit to generate a static HTML version of the page at build time so it can be hosted without a server.
**ssr** = false disables server-side rendering, meaning the page runs entirely in the browser like a client-side app.

It will ensure we aren't accidentally using something only available on the server.

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

`contactsheet`

```
git remote add origin git@github.com:abitofcode/contactsheet.git
git branch -M main
git push -u origin main
```

Go to Settings > Pages > Branch (main) > Folder (/docs) > Save

A link to the page should appear after a short while https://abitofcode.github.io/contactsheet/

However: Still got gotcherd.

We Added a post build step but **DID NOT** run the build again, so the .nojekyll file never got added to the docs folder. Looking at the console in the browser shows a lot of 404 errors as the \_app folder has not been output by Jekyll.

```sh
npm run build
git add -A
git commit -m"Static build generated"
git push
```

Visit the link in Pages https://abitofcode.github.io/contactsheet/

(Sometimes can take a moment to update)

## Making it do somethin useful

```text
Create a single self-contained Svelte component for +page.svelte in a SvelteKit project.

The component should:

- Allow selecting multiple image files (PNG/JPG/JPEG)
- Show preview thumbnails in a responsive grid
- Include a button “Download Contact Sheet PDF”
- Generate an A4 portrait PDF using jsPDF
- Arrange images in a 3-column grid
- Show each image filename underneath in small text
- Automatically create new pages if needed
- Run entirely client-side

Use <script lang="ts">.
Assume jsPDF is installed.

Please include a short explanation, then provide the full Svelte component inside a single code block that I can copy.
```

https://chatgpt.com/c/69966ba6-e84c-8397-a454-457669f4ce60

```sh
npm i jspdf
```

`+page.svelte`

```javascript
<script lang="ts">
	import { jsPDF } from 'jspdf';

	type ImageItem = {
		file: File;
		url: string;
	};

	let images: ImageItem[] = [];

	function handleFiles(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		const files = Array.from(input.files).filter((file) =>
			['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
		);

		images = files.map((file) => ({
			file,
			url: URL.createObjectURL(file)
		}));
	}

	function loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	async function downloadPDF() {
		if (images.length === 0) return;

		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4'
		});

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();

		const margin = 15;
		const columns = 3;
		const gap = 5;

		const usableWidth = pageWidth - margin * 2;
		const cellWidth = (usableWidth - gap * (columns - 1)) / columns;
		const cellHeight = 60; // fixed height for consistency
		const filenameHeight = 6;

		let x = margin;
		let y = margin;
		let col = 0;

		for (let i = 0; i < images.length; i++) {
			const { url, file } = images[i];

			const img = await loadImage(url);

			// Calculate proportional scaling
			const ratio = Math.min(
				cellWidth / img.width,
				cellHeight / img.height
			);

			const imgWidth = img.width * ratio;
			const imgHeight = img.height * ratio;

			const imgX = x + (cellWidth - imgWidth) / 2;
			const imgY = y;

			doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);

			// Filename
			doc.setFontSize(8);
			doc.text(
				file.name,
				x + cellWidth / 2,
				y + cellHeight + filenameHeight - 2,
				{ align: 'center' }
			);

			col++;

			if (col === columns) {
				col = 0;
				x = margin;
				y += cellHeight + filenameHeight + gap;

				// New page if needed
				if (y + cellHeight + filenameHeight > pageHeight - margin) {
					doc.addPage();
					y = margin;
				}
			} else {
				x += cellWidth + gap;
			}
		}

		doc.save('contact-sheet.pdf');
	}
</script>

<svelte:head>
	<title>Contact Sheet Generator</title>
</svelte:head>

<div class="container">
	<h1>Contact Sheet Generator</h1>

	<input
		type="file"
		accept="image/png,image/jpeg,image/jpg"
		multiple
		on:change={handleFiles}
	/>

	{#if images.length > 0}
		<button on:click={downloadPDF}>
			Download Contact Sheet PDF
		</button>
	{/if}

	<div class="grid">
		{#each images as img}
			<div class="thumb">
				<img src={img.url} alt={img.file.name} />
				<div class="filename">{img.file.name}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 1rem;
		font-family: system-ui, -apple-system, BlinkMacSystemFont,
			'Segoe UI', sans-serif;
	}

	h1 {
		margin-bottom: 1rem;
	}

	input {
		margin-bottom: 1rem;
	}

	button {
		margin-bottom: 1.5rem;
		padding: 0.5rem 1rem;
		background: #111;
		color: white;
		border: none;
		cursor: pointer;
	}

	button:hover {
		background: #333;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.thumb {
		text-align: center;
		border: 1px solid #ddd;
		padding: 0.5rem;
		background: #fafafa;
	}

	.thumb img {
		max-width: 100%;
		max-height: 120px;
		object-fit: contain;
		display: block;
		margin: 0 auto 0.5rem auto;
	}

	.filename {
		font-size: 0.75rem;
		word-break: break-all;
		color: #444;
	}
</style>
```
