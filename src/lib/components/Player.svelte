<script lang="ts">
	// Import styles.
	import 'vidstack/player/styles/base.css';
	// Register elements.
	import 'vidstack/player';
	import 'vidstack/player/ui';
	import 'vidstack/icons';

	import { onMount } from 'svelte';
	import { isHLSProvider, type MediaCanPlayEvent, type MediaProviderChangeEvent } from 'vidstack';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import VideoLayout from '$lib/components/player/layouts/VideoLayout.svelte';

	export let title = '';
	export let src = '';
	export let status = '';

	let thumbnails = '';

	onMount(() => {
		loadPlayer();
	});

	function loadPlayer() {
		const player = document.getElementById('player');
		if (player) {
			player.src = status === 'ready' ? `http://localhost/${src}/transcoded/master.m3u8` : `http://localhost/${src}/original.mp4`;
			player.title = title;

			if (status === 'ready') {
				thumbnails = `http://localhost/${src}/transcoded/thumbnails.vtt`;
			}
		}
	}

	function onPlayerReady() {
		const provider = document.getElementById('provider');
		if (provider) if (provider.firstElementChild) provider.firstElementChild.style.height = '100%';

		const instance = document.querySelector('media-player');
		if (instance) console.log(instance.controls);
	}
</script>

<media-player id="player" class="max-h-[50dvh]" autoplay="true" on:can-play={onPlayerReady}>
	<media-provider id="provider" class="bg-black"></media-provider>
	<VideoLayout bind:thumbnails>
	</VideoLayout>
</media-player>
