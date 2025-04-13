<script lang="ts">
	import Marquee from '$lib/components/Marquee.svelte';
	import { SOL_SYMBOL } from '$lib/symbols';
	import Record from '$lib/ui/marketplace/Record.svelte';
	import {
		checkWallet,
		connectWallet,
		getLocalStorageWalletAddress
	} from '$lib/wallet/helpers/connect-wallet';
	import { onMount } from 'svelte';

	const agents = Array.from({ length: 20 }).map((_, i) => ({ name: `Agent${i}` }));

	onMount(async () => {
		await checkWallet();
		const localStorageAddress = getLocalStorageWalletAddress();
		if (!localStorageAddress) return;
		if (window.solana || window.solflare || window.backpack) connectWallet();
	});
</script>

<svelte:head>
	<title>DARK Plays: Marketplace</title>
</svelte:head>

<div class="container mx-auto">
	<!-- MARQUEE -->
	<div class="mb-6 py-6">
		{#snippet eachSnippet(item: any)}
			<div
				class="mx-1 flex aspect-[1/1.25] w-[125px] flex-col justify-end gap-2 rounded-lg bg-cover bg-no-repeat p-1 transition-all hover:saturate-150"
				style="background: url('https://picsum.photos/seed/{item.name}/200/250');"
			>
				<p class="font-bold">{item.name}</p>
				<div class="flex gap-1 text-xs">
					<span class="rounded-lg p-1 backdrop-blur-md">76%</span>
					<span class="rounded-lg p-1 backdrop-blur-md">0.3{SOL_SYMBOL}</span>
				</div>
			</div>
		{/snippet}
		<Marquee items={agents.splice(0, 5)} {eachSnippet} />
	</div>

	<!-- TABLE HEADER -->
	<div
		class="border-b-brand-fore/10 text-brand-highlight hidden grid-cols-[3fr_1fr_1fr_1fr] gap-1 border-b-1 pb-1 text-xs font-bold tracking-wide uppercase md:grid"
	>
		<span class="border-r-brand-fore/10 border-r-1"> Agent </span>
		<span> Personality </span>
		<span> Available Shares </span>
		<span> Prices </span>
	</div>

	<!-- AGENT LIST -->
	{#each agents as agent, i (i)}
		{@const isEven = i % 2 == 0}
		<Record isFirst={i == 0} {isEven} {agent} />
	{/each}
</div>
