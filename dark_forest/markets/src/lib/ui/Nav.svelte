<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import ShineBorder from '$lib/components/ShineBorder.svelte';
	import { BadgeInfo } from 'lucide-svelte';
	import { walletStore } from '$lib/wallet/walletStore.svelte';
	import { connectWallet, disconnectWallet } from '$lib/wallet/helpers/connect-wallet';

	const isMarketplace = $derived(page.url.pathname === base + '/');
	const isShop = $derived(page.url.pathname === base + '/shop');

	function truncateAddress(address: string) {
		if (!address) return '';
		return `${address.slice(0, 4)}...${address.slice(-4)}`;
	}
</script>

<div class="bg-brand-fore/0 px-2 py-4">
	<div
		class="text-brand-highlight container mx-auto flex items-center justify-center font-bold sm:justify-between"
	>
		<a href="https://www.darkresearch.ai" class="group hidden items-center sm:flex">
			<img
				src="https://pbs.twimg.com/profile_images/1908669567083163649/fo1DCESl_400x400.jpg"
				alt="dark research ai"
				class="w-6 transition-all group-hover:scale-125"
			/>
			<span class="text-brand-fore z-20 tracking-widest"> DARK </span>
			<span class="ml-2 text-xs font-thin">plays <i>Dark Forest</i></span></a
		>
		<div class="flex items-center gap-4">
			<a
				href="{base}/"
				class:text-brand-fore={isMarketplace}
				class:hover:opacity-70={!isMarketplace}
			>
				MarketPlace
			</a>
			<a href="{base}/shop" class:text-brand-fore={isShop} class:hover:opacity-70={!isShop}>Shop</a>
			<a href="{base}/about" class="text-xs font-thin hover:opacity-70"><BadgeInfo /></a>
			<button
				onclick={async () => {
					if (!$walletStore.walletAddress) {
						await connectWallet();
					} else await disconnectWallet();
				}}
				class="border-brand-highlight/50 hover:bg-brand-fore hover:text-brand-back cursor-pointer rounded border-1 px-3 py-1 transition-all"
			>
				{$walletStore.walletAddress
					? truncateAddress($walletStore.walletAddress)
					: 'Connect Wallet'}
			</button>
		</div>
	</div>
</div>
<div class="relative z-20 mb-[2px] h-0 w-full">
	<ShineBorder />
</div>
