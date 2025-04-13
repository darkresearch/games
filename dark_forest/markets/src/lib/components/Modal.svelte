<script lang="ts">
	import { X } from 'lucide-svelte';

	let { onClose }: { onClose(): void } = $props();

	// Event handlers
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleOverlayClick() {
		onClose();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Overlay with Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
	<!-- Modal Dialog -->
	<dialog
		class="bg-brand-dark text-brand-fore mx-4 w-full max-w-md rounded-lg p-0 shadow-lg open:block"
		open
		aria-labelledby="modal-title"
	>
		<!-- Modal Header with Close Button -->
		<div class="flex justify-end p-2">
			<button
				class="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
				onclick={onClose}
				aria-label="Close"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Modal Body -->
		<div class="px-6 pb-6">
			<p>hi</p>
		</div>
	</dialog>

	<!-- Invisible overlay to close modal when clicking outside -->
	<button
		class="fixed inset-0 h-full w-full cursor-default bg-transparent"
		onclick={handleOverlayClick}
		aria-label="Close modal"
		tabindex="-1"
	></button>
</div>

<style>
	/* Dialog styling */
	dialog {
		margin: auto;
		/* background: transparent; */
		/* color: white; */
		/* border: none; */
		z-index: 51;
	}
	dialog::backdrop {
		display: none;
	}
</style>
