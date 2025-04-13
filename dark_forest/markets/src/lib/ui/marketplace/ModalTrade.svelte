<script lang="ts">
	import { X, ArrowDownUp, TrendingUp, TrendingDown, Circle } from 'lucide-svelte';
	import { USDC_SYMBOL, SOL_SYMBOL } from '$lib/symbols';
	import RadarChart from '$lib/components/RadarChart.svelte';

	let { onClose }: { onClose(): void } = $props();
	let activeTab: 'buy' | 'sell' = $state('sell');
	let amount = $state('');
	let estimatedReturn = $state('0.00');

	// Mock data for the token
	const buyTokenData = {
		name: 'USDC',
		symbol: USDC_SYMBOL,
		price: 1.0,
		change24h: -0.02,
		volume24h: 1243500,
		marketCap: 8200000,
		supply: 8200000,
		allTimeHigh: 1.02,
		allTimeLow: 0.98
	};

	const tokenData = {
		name: 'Agent Share',
		symbol: SOL_SYMBOL,
		price: 169.42,
		change24h: 2.3,
		volume24h: 427800,
		marketCap: 74290000,
		supply: 438490,
		allTimeHigh: 260.98,
		allTimeLow: 7.96
	};

	// Event handlers
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleOverlayClick() {
		onClose();
	}

	function handleAmountChange(e: Event) {
		const target = e.target as HTMLInputElement;
		amount = target.value;

		// Calculate estimated return
		if (amount && !isNaN(parseFloat(amount))) {
			if (activeTab === 'buy') {
				estimatedReturn = (parseFloat(amount) / buyTokenData.price).toFixed(6);
			} else {
				estimatedReturn = (parseFloat(amount) * tokenData.price).toFixed(2);
			}
		} else {
			estimatedReturn = '0.00';
		}
	}

	function switchTab() {
		activeTab = activeTab === 'buy' ? 'sell' : 'buy';
		amount = '';
		estimatedReturn = '0.00';
	}

	function handleSubmit() {
		// Handle the trade submission here
		console.log(
			`${activeTab === 'buy' ? 'Buying' : 'Selling'} ${amount} ${activeTab === 'buy' ? tokenData.symbol : buyTokenData.symbol}`
		);
		// Close the modal after submission
		onClose();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Overlay with Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
	<!-- Modal Dialog -->
	<dialog
		class="bg-brand-back text-brand-fore mx-4 h-full w-full max-w-2xl rounded-lg p-0 shadow-lg open:block md:max-h-[535px]"
		open
		aria-labelledby="modal-title"
	>
		<!-- Modal Body -->
		<div class="grid h-full grid-cols-1 overflow-auto md:grid-cols-2">
			<!-- Left Column: Stats and Metadata -->
			<div class="md:max-h-auto relative bg-black/20 p-6 md:overflow-clip">
				<div class="flex flex-col gap-4">
					<!-- Token Information Header -->
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="rounded-full bg-blue-500 p-2">
								{activeTab === 'sell' ? tokenData.symbol : buyTokenData.symbol}
							</div>
							<div>
								<h2 class="text-xl font-bold">
									{activeTab === 'sell' ? tokenData.name : buyTokenData.name}
								</h2>
								<p class="text-brand-highlight text-xs">
									${activeTab === 'sell'
										? tokenData.price.toFixed(2)
										: buyTokenData.price.toFixed(2)}
								</p>
							</div>
						</div>
						<div>
							<div class="flex items-center gap-1">
								{#if (activeTab === 'sell' ? tokenData.change24h : buyTokenData.change24h) >= 0}
									<TrendingUp class="h-4 w-4 text-green-500" />
									<span class="text-green-500">
										+{(activeTab === 'sell' ? tokenData.change24h : buyTokenData.change24h).toFixed(
											2
										)}%
									</span>
								{:else}
									<TrendingDown class="h-4 w-4 text-red-500" />
									<span class="text-red-500">
										{(activeTab === 'sell' ? tokenData.change24h : buyTokenData.change24h).toFixed(
											2
										)}%
									</span>
								{/if}
							</div>
							<p class="text-brand-highlight/70 text-xs">24h change</p>
						</div>
					</div>

					<!-- Token Stats Grid -->
					<div class="mt-4 grid grid-cols-2 gap-4">
						<div class="border-brand-highlight/20 rounded border-1 bg-black/30 p-3">
							<p class="text-brand-highlight/70 text-xs">24h Volume</p>
							<p class="text-sm font-bold">
								${(activeTab === 'sell'
									? tokenData.volume24h
									: buyTokenData.volume24h
								).toLocaleString()}
							</p>
						</div>
						<div class="border-brand-highlight/20 rounded border-1 bg-black/30 p-3">
							<p class="text-brand-highlight/70 text-xs">Market Cap</p>
							<p class="text-sm font-bold">
								${(activeTab === 'sell'
									? tokenData.marketCap
									: buyTokenData.marketCap
								).toLocaleString()}
							</p>
						</div>
						<div class="border-brand-highlight/20 rounded border-1 bg-black/30 p-3">
							<p class="text-brand-highlight/70 text-xs">Circulating Supply</p>
							<p class="text-sm font-bold">
								{(activeTab === 'sell' ? tokenData.supply : buyTokenData.supply).toLocaleString()}
							</p>
						</div>
						<div class="border-brand-highlight/20 rounded border-1 bg-black/30 p-3">
							<p class="text-brand-highlight/70 text-xs">Price Range</p>
							<div class="flex justify-between text-sm">
								<span class="text-red-500">
									${(activeTab === 'sell' ? tokenData.allTimeLow : buyTokenData.allTimeLow).toFixed(
										2
									)}
								</span>
								<span class="text-green-500">
									${(activeTab === 'sell'
										? tokenData.allTimeHigh
										: buyTokenData.allTimeHigh
									).toFixed(2)}
								</span>
							</div>
						</div>
					</div>

					<!-- Chart Placeholder -->
					<div
						class="border-brand-highlight/20 relative mt-4 flex h-58 items-center justify-center rounded border-1 bg-black/30 p-3"
					>
						<!-- <p class="text-brand-highlight/70 text-xs">Price Chart (Coming Soon)</p> -->
						<RadarChart />
					</div>
				</div>
			</div>

			<!-- Right Column: Trade Window -->
			<div class="relative flex flex-col px-6 py-4 md:overflow-auto">
				<!-- Close Button -->
				<button
					class="absolute top-2 right-2 cursor-pointer rounded-full bg-black/30 px-2 py-2 transition-all hover:scale-110"
					onclick={onClose}
				>
					<X class="w-5" />
				</button>

				<!-- Trade Interface -->
				<div class="mt-8 flex flex-col gap-4">
					<!-- Tab Toggle -->
					<div class="flex overflow-hidden rounded bg-black/20">
						<button
							class="flex-1 py-2 text-center transition-colors {activeTab === 'sell'
								? 'bg-black/40 font-bold'
								: 'text-brand-highlight/70 hover:bg-black/30'}"
							onclick={() => {
								activeTab = 'sell';
								amount = '';
								estimatedReturn = '0.00';
							}}
						>
							Selling
						</button>
						<button
							class="flex-1 py-2 text-center transition-colors {activeTab === 'buy'
								? 'bg-black/40 font-bold'
								: 'text-brand-highlight/70 hover:bg-black/30'}"
							onclick={() => {
								activeTab = 'buy';
								amount = '';
								estimatedReturn = '0.00';
							}}
						>
							Buying
						</button>
					</div>

					<!-- Token Selector (Currently Static) -->
					<div class="flex items-center gap-2">
						<div class="flex flex-1 items-center gap-2 rounded bg-black/40 p-3">
							<div class="rounded-full bg-blue-500 p-1.5 text-xs">
								{activeTab === 'sell' ? tokenData.symbol : buyTokenData.symbol}
							</div>
							<span>{activeTab === 'sell' ? tokenData.name : buyTokenData.name}</span>
							<span class="ml-auto text-xs opacity-50"> $0 </span>
						</div>
						<button class="rounded bg-black/40 p-2" onclick={switchTab}>
							<ArrowDownUp class="h-5 w-5" />
						</button>
					</div>

					<form>
						<!-- Input Amount -->
						<div class="mt-2">
							<label for="amount" class="text-brand-highlight/70 text-xs">
								{activeTab === 'sell' ? 'Amount to Sell' : 'Amount to Buy'}
							</label>
							<div class="relative mt-1">
								<input
									type="number"
									id="amount"
									class="border-brand-highlight/20 focus:border-brand-highlight/60 w-full rounded border-1 bg-black/20 p-3 pr-12 focus:outline-none"
									placeholder="0.00"
									value={amount}
									oninput={handleAmountChange}
								/>
								<div class="text-brand-highlight absolute inset-y-0 right-0 flex items-center pr-3">
									{activeTab === 'sell' ? tokenData.symbol : '$'}
								</div>
							</div>
						</div>

						<!-- Estimated Return -->
						<div class="mt-2">
							<label class="text-brand-highlight/70 text-xs">
								{activeTab === 'sell' ? 'You Will Receive' : 'You Will Receive'}
							</label>
							<div class="relative mt-1">
								<input
									type="text"
									class="border-brand-highlight/20 w-full rounded border-1 bg-black/20 p-3 pr-12 focus:outline-none"
									readonly
									value={estimatedReturn}
								/>
								<div class="text-brand-highlight absolute inset-y-0 right-0 flex items-center pr-3">
									{activeTab === 'sell' ? '$' : buyTokenData.symbol}
								</div>
							</div>
						</div>
					</form>
					<!-- Fee Info -->
					<div class="text-brand-highlight/70 mt-2 flex items-center gap-1 text-xs">
						<Circle class="h-3 w-3" />
						<span>Fee: 0.05%</span>
					</div>

					<!-- Submit Button -->
					<button
						class="bg-brand-fore/70 text-brand-back hover:bg-brand-fore mt-auto cursor-pointer rounded py-3 font-bold transition-all {!amount
							? 'cursor-not-allowed opacity-50'
							: ''}"
						onclick={handleSubmit}
						disabled={!amount}
					>
						{activeTab === 'sell' ? 'Sell' : 'Buy'}
						{activeTab === 'sell' ? tokenData.name : buyTokenData.name}
					</button>
				</div>
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
