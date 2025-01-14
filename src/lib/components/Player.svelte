<script lang="ts">
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player';
	import 'vidstack/player/ui';
	import 'vidstack/icons';
	import Hls from 'hls.js';

	import { onMount } from 'svelte';
	import VideoLayout from '$lib/components/player/layouts/VideoLayout.svelte';
	import CustomAbrController from '$lib/utils/CustomAbrController';

	let { title = '', src = '', status = '', poster = '' } = $props();
	let thumbnails = $state('');
	let playerReady = $state(false);

	onMount(() => {
		configureProvider();
		if (status === 'ready') {
			thumbnails = `http://localhost/${src}/transcoded/thumbnails.vtt`;
		}
	});

	function configureProvider() {
		const player = document.getElementById('player');
		if (player) {
			player.addEventListener('provider-change', (event) => {
				const provider = event.detail;
				console.log('provider', provider);
				if (provider?.type === 'hls') {
					provider.library = Hls;
					// Configuration de hls.js
					provider.config = {
						startLevel: -1,
						testBandwidth: true,
						lowLatencyMode: true,
						abrController: CustomAbrController,
						abrBandWidthUpFactor: 1.0
					};
				}
			});
		}
		const poster = document.getElementById('poster');
		if (poster) {
			const img = poster.firstElementChild as HTMLImageElement;
			if (img) {
				img.style.objectFit = 'contain';
				img.style.width = '100%';
				img.style.height = '100%';
			}
		}
	}

	function onPlayerReady() {
		const provider = document.getElementById('provider');
		if (provider) if (provider.firstElementChild) provider.firstElementChild.style.height = '100%';
	}
</script>

<media-player load="eager" id="player" playsInline viewType="video" streamType="on-demand" title={title}
							src={status === 'ready' ? `http://localhost/${src}/transcoded/master.m3u8` : `http://localhost/${src}/original.mp4`}
							class="md:h-full md:max-h-[80dvh]" keyTarget="document" autoplay autoPlay oncan-load={() => playerReady = true}
							oncan-play={onPlayerReady}>
	<media-provider id="provider" class="bg-black">
		<media-poster
			id="poster"
			class="absolute flex justify-center items-center object-cover left-0 top-0 right-0 bottom-0 opacity-0 inset-0 transition-opacity data-[visible]:opacity-100"
			src={poster}
			alt={title}
		></media-poster>
	</media-provider>
	<VideoLayout bind:thumbnails>
	</VideoLayout>
</media-player>

{#if !playerReady}
	<div class="flex justify-center items-center bg-black w-full md:h-full md:max-h-[calc(80dvh+0.33rem)]">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
				 stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
				 class="lucide lucide-loader-circle w-32 h-32 animate-spin">
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	</div>
{/if}
