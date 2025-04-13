<script lang="ts" generics="T">
	let { items = [], eachSnippet }: { items: T[]; eachSnippet(item: T): any } = $props();
</script>

{#snippet content()}
	<div class="marquee-content">
		{#each items as item}
			{@render eachSnippet(item)}
		{/each}
	</div>
{/snippet}

<div class="marquee-container">
	<div
		class="from-brand-back/0 to-brand-back absolute left-0 z-10 h-full w-20 bg-gradient-to-l"
	></div>
	<div
		class="to-brand-back/0 from-brand-back absolute right-0 z-10 h-full w-20 bg-gradient-to-l"
	></div>
	<div class="marquee">
		{@render content()}
		{@render content()}
		{@render content()}
		{@render content()}
		{@render content()}
		{@render content()}
	</div>
</div>

<style>
	@keyframes marquee {
		0% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.marquee-container {
		overflow: hidden;
		white-space: nowrap;
		position: relative;
	}

	.marquee {
		display: inline-flex;
		animation: marquee 50s linear infinite;
	}

	/* Duplicate content */
	.marquee-content {
		display: flex;
	}
</style>
