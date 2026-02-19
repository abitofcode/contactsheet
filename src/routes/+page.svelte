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
			const ratio = Math.min(cellWidth / img.width, cellHeight / img.height);

			const imgWidth = img.width * ratio;
			const imgHeight = img.height * ratio;

			const imgX = x + (cellWidth - imgWidth) / 2;
			const imgY = y;

			doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);

			// Filename
			doc.setFontSize(8);
			doc.text(file.name, x + cellWidth / 2, y + cellHeight + filenameHeight - 2, {
				align: 'center'
			});

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

	<input type="file" accept="image/png,image/jpeg,image/jpg" multiple on:change={handleFiles} />

	{#if images.length > 0}
		<button on:click={downloadPDF}> Download Contact Sheet PDF </button>
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
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
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
