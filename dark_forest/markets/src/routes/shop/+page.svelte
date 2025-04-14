<script lang="ts">
	import { base } from '$app/paths';
	import { SOL_SYMBOL } from '$lib/symbols';
	import ModalPowerup from '$lib/ui/shop/modal/ModalPowerup.svelte';

	let modalIsOpen = $state(false);
</script>

<svelte:head>
	<title>DARK Plays: Shop</title>
</svelte:head>

<!-- SNIPPETS -->

{#snippet tile(text: string, price: string, videoSrc: string)}
	<button
		onclick={() => (modalIsOpen = true)}
		class="hover:border-brand-highlight/70 border-brand-highlight/30 relative flex min-h-[150px] cursor-pointer flex-col justify-end overflow-clip rounded-lg border-1 transition-all"
	>
		<div class="z-10 flex justify-between p-2 text-sm tracking-wide backdrop-blur-lg">
			<p class="font-bold">{text}</p>
			<p class="">{price}{SOL_SYMBOL}</p>
		</div>
		<video src="{base}{videoSrc}" muted autoplay loop class="absolute top-0 left-0"></video>
	</button>
{/snippet}

<!-- START DOCUMENT -->

{#if modalIsOpen}
	<ModalPowerup onClose={() => (modalIsOpen = false)} />
{/if}

<div class="container mx-auto px-2 sm:px-0">
	<h1 class="pt-4 text-2xl font-bold">Powerup Shop</h1>
	<p class="text-brand-highlight">
		Deploy advantages to the map! Sway the tide of the game by placing powerups on the map.
	</p>

	<div class="mt-4 grid grid-cols-2 gap-2">
		{@render tile('Buy Planet', '0.05', '/planet.mp4')}
		{@render tile('Buy Artifact', '0.09', '/artifact.mp4')}
		{@render tile('Reveal map', '0.03', '/artifact.mp4')}
		{@render tile('New spawn point', '0.15', '/planet.mp4')}
	</div>
</div>
