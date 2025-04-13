<script lang="ts">
	// No need for icon imports as we'll use Unicode symbols
	import ModalTrade from './ModalTrade.svelte';
	import { SOL_SYMBOL } from '$lib/symbols';

	export let isEven = true;
	export let agent: any;
	export let isFirst = false;

	let isOpen = false;

	type PerformanceTag = {
		label: string;
		class: string;
	};

	// Generate mock performance data
	const performanceTags: PerformanceTag[] = [
		{ label: 'High Spender', class: 'bg-emerald-500/20 text-emerald-400' },
		{ label: 'Techy', class: 'bg-amber-500/20 text-amber-400' },
		{ label: 'Aggressive', class: 'bg-red-500/20 text-red-400' },
		{ label: 'Balanced', class: 'bg-blue-500/20 text-blue-400' },
		{ label: 'Thrifty', class: 'bg-purple-500/20 text-purple-400' }
	];

	// Randomly select 1-2 performance tags
	const selectedTags: PerformanceTag[] = [];
	const numTags = Math.floor(Math.random() * 2) + 1; // 1 or 2 tags
	const shuffledTags = [...performanceTags].sort(() => Math.random() - 0.5);
	for (let i = 0; i < numTags; i++) {
		selectedTags.push(shuffledTags[i]);
	}

	// Generate mock shares data
	const sharesTotal = Math.floor(Math.random() * 10000) + 0;
	const sharesAvailable = Math.floor(sharesTotal * (Math.random() * 0.5 + 0.1)); // 10-60% available

	// Generate mock price data
	const currentPrice = parseFloat((Math.random() * 0.3).toFixed(2));
	const priceChange = parseFloat((Math.random() * 20 - 10).toFixed(2)); // -10% to +10%
</script>

{#if isOpen}
	<ModalTrade onClose={() => (isOpen = false)} />
{/if}

<button
	class="my-1 grid w-full cursor-pointer grid-cols-1 items-center justify-items-start gap-3 self-start py-2 hover:opacity-90 md:grid-cols-[3fr_1fr_1fr_1fr] md:gap-1"
	class:mt-0={isFirst}
	class:bg-gradient-to-l={isEven}
	class:to-brand-back={isEven}
	class:from-slate-800={isEven}
	onclick={() => (isOpen = true)}
>
	<!-- AGENT -->
	<div
		class="border-r-brand-fore/10 flex w-full items-center justify-center gap-4 border-r-1 md:justify-start"
	>
		<div class="relative">
			<img
				alt="ai agent"
				src="https://picsum.photos/seed/{agent.name}/200/250"
				class="aspect-[1] w-[50px] rounded-lg object-cover"
			/>
			<div
				class="bg-brand-back border-brand-fore/10 absolute right-[-5px] bottom-[-5px] grid aspect-[1] w-4 place-items-center rounded border-1 text-xs"
			>
				{#if Math.random() > 0.5}
					<span class="absolute text-emerald-400">↑</span>
				{:else}
					<span class="absolute text-red-400">↓</span>
				{/if}
			</div>
		</div>
		<div class="flex flex-col md:items-start">
			<p>{agent.name}</p>
			<p class="text-brand-highlight/60 text-xs">Lorem upsum dolorem suhi</p>
		</div>
	</div>

	<!-- PERFORMANCE -->
	<div class="flex w-full justify-center gap-1 md:justify-start">
		{#each selectedTags as tag}
			<span class="rounded px-2 py-0.5 text-xs {tag.class} w-fit">{tag.label}</span>
		{/each}
	</div>
	<!-- SHARES -->
	<div class="flex w-full flex-col items-center justify-center md:items-start">
		<span class="text-sm font-medium">{sharesAvailable.toLocaleString()}</span>
		<div class="mt-1 w-full max-w-[80px]">
			<div class="relative h-1.5 w-full overflow-hidden rounded-full bg-black/40">
				<div
					class="bg-brand-highlight/70 absolute top-0 left-0 h-full rounded-full"
					style="width: {Math.round((sharesAvailable / sharesTotal) * 100)}%"
				></div>
			</div>
			<span class="text-brand-highlight/60 mt-0.5 block text-[10px]"
				>{Math.round((sharesAvailable / sharesTotal) * 100)}% Available</span
			>
		</div>
	</div>
	<!-- PRICE -->
	<div class="flex w-full flex-col items-center justify-center md:items-start">
		<span class="flex items-center gap-1 text-sm font-medium">
			{SOL_SYMBOL}
			{currentPrice.toFixed(2)}
		</span>
		<span
			class="flex items-center gap-0.5 text-xs {priceChange >= 0
				? 'text-emerald-400'
				: 'text-red-400'}"
		>
			{#if priceChange >= 0}
				<span class="mr-1">↗</span>
				+{priceChange}%
			{:else}
				<span class="mr-1">↘</span>
				{priceChange}%
			{/if}
		</span>
	</div>
</button>
