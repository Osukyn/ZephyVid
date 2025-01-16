<script lang="ts">
	let {
		avatarUrl,
		fallbackName,
		size = '8',
		fallbackColor = 'neutral',
		ring = false,
	}: {
		avatarUrl: string | null,
		fallbackName: string,
		size?: string,
		fallbackColor?: string,
		ring?: boolean,
	} = $props();
	let fontSizeRem = $derived(tailwindSizeToRem(size) * 0.7);
	let ringTailwindParameters = $derived.by(() => {
		return ring ? ` ring-base-content ring ring-offset-2 ring-offset-base-100 ring-2` : '';
	});

	function tailwindSizeToRem(twSize: string) {
		// En Tailwind, h-8 = 2rem, h-1 = 0.25rem, etc.
		// On part du principe que 1 => 0.25rem
		const numeric = parseInt(twSize, 10);
		// 1 => 0.25rem, 2 => 0.5rem, 4 => 1rem, 8 => 2rem, etc.
		return numeric * 0.25;
	}
</script>
<div class="avatar select-none{ avatarUrl ? '' : ' placeholder' }">
	<div
		class="bg-{fallbackColor} text-{fallbackColor}-content h-{size} w-{size} rounded-full{ringTailwindParameters}">
		{#if avatarUrl}
			<img
				src={avatarUrl}
				alt="avatar"
			/>
		{:else}
			<span class="leading-none font-bold" style="font-size: {fontSizeRem}rem">{fallbackName[0].toUpperCase()}</span>
		{/if}
	</div>
</div>
