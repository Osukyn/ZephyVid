<script lang="ts">
	let {
		avatarUrl,
		fallbackName,
		size = '8',
		fallbackColor = 'neutral',
	} : {
		avatarUrl: string | null,
		fallbackName: string,
		size?: string,
		fallbackColor?: string,
	} = $props();
	let fontSizeRem = $state(tailwindSizeToRem(size) * 0.5);

	function tailwindSizeToRem(twSize: string) {
		// En Tailwind, h-8 = 2rem, h-1 = 0.25rem, etc.
		// On part du principe que 1 => 0.25rem
		const numeric = parseInt(twSize, 10);
		// 1 => 0.25rem, 2 => 0.5rem, 4 => 1rem, 8 => 2rem, etc.
		return numeric * 0.25;
	}

	$effect(() => {
		fontSizeRem = tailwindSizeToRem(size) * 0.70;
	});
</script>
{#if avatarUrl}
	<img
		src={avatarUrl}
		alt="avatar"
		class="h-{size} w-{size} rounded-full"
	/>
{:else}
	<div class="bg-{fallbackColor} text-{fallbackColor}-content h-{size} w-{size} rounded-full flex items-center justify-center">
		<span class="leading-none font-bold" style="font-size: {fontSizeRem}rem">{fallbackName[0].toUpperCase()}</span>
	</div>
{/if}
