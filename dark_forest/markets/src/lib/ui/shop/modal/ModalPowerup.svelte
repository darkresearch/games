<script lang="ts">
	import { base } from '$app/paths';
	import { SOL_SYMBOL } from '$lib/symbols';
	import { CircleAlert, X } from 'lucide-svelte';

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

{#snippet rightBody()}
	<button
		class="absolute top-2 right-2 cursor-pointer rounded-full bg-black/30 px-3 py-2 transition-all hover:scale-125 sm:bg-transparent"
		onclick={onClose}
	>
		<X class="w-5" />
	</button>
	<p class="text-2xl font-bold">Buy Planet</p>
	<p class="text-brand-highlight text-xs">
		0.09 {SOL_SYMBOL} <span class="opacity-30">~$355 USDC</span>
	</p>
	<p class="mt-4 text-sm font-bold">Description</p>
	<p class="text-brand-highlight text-xs font-normal">
		Expand your AI agent's territory with a completely new planet. Each planet comes with unique
		resources, challenges, and opportunities for your agent to exploit. Strategic positioning of
		planets can create powerful synergies between your agents.
	</p>
	<div class="mt-4 flex h-full flex-col justify-between gap-2">
		<div
			class="text-brand-fore border-brand-highlight/20 flex flex-col border-1 bg-sky-950 p-2 text-xs"
		>
			<span class="flex items-center gap-1 font-bold"
				><CircleAlert class="w-3" /> Requirements
			</span>
			<span class="text-brand-highlight">
				Requires an active AI agent to colonize and manage the planet
			</span>
		</div>
		<select class="border-brand-highlight/20 rounded border-1 bg-black/20 px-2 py-1">
			<option> Choose agent </option>
			<option> Agent 1 </option>
			<option> Agent 2 </option>
		</select>
		<button
			class="bg-brand-fore/70 text-brand-back hover:bg-brand-fore cursor-pointer rounded py-2 transition-all"
		>
			Purchase for 0.09{SOL_SYMBOL}
		</button>
	</div>
{/snippet}

<!-- START DOCUMENT -->

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Overlay with Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
	<!-- Modal Dialog -->
	<dialog
		class="bg-brand-back text-brand-fore mx-4 h-full w-full max-w-2xl rounded-lg p-0 shadow-lg open:block md:max-h-[400px]"
		open
		aria-labelledby="modal-title"
	>
		<!-- Modal Body -->
		<div class="grid h-full grid-cols-1 md:grid-cols-2">
			<div class="relative overflow-clip sm:rounded-l">
				<video src="{base}/planet.mp4" muted autoplay loop class="scale-150"></video>
			</div>
			<div class="relative flex flex-col overflow-auto px-6 py-4">
				{@render rightBody()}
			</div>
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
