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
