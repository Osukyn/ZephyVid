<script lang="ts">
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player';
	import 'vidstack/player/ui';
	import 'vidstack/icons';
	import Hls from 'hls.js';

	import { onDestroy, onMount } from 'svelte';
	import VideoLayout from '$lib/components/player/layouts/VideoLayout.svelte';
	import CustomAbrController from '$lib/utils/CustomAbrController';

	let { title = '', src = '', status = '', poster = '', id = '', autoplay = true } = $props();
	let thumbnails = $state('');
	let playerReady = $state(false);
	let hasCountedView = $state(false);
	// Variables pour tracker le temps de visionnage
	let lastTime = $state(0);
	let accumulatedWatchTime = $state(0);
	const idConst = id;

	// Fonction pour envoyer le temps de visionnage via sendBeacon
	function sendWatchTime() {
		if (accumulatedWatchTime > 0) {
			const payload = JSON.stringify({
				videoId: idConst,
				watchDuration: accumulatedWatchTime
			});
			// Utilisation de sendBeacon qui retourne toujours true (mais ne garantit pas le succès)
			navigator.sendBeacon('/api/video/watch-session', payload);
			console.log('Beacon envoyé');
		}
	}

	onMount(() => {
		configureProvider();
		if (status === 'ready') {
			thumbnails = `http://localhost/${src}/transcoded/thumbnails.vtt`;
		}
		// On ajoute un écouteur pour l'événement "pagehide" qui est déclenché lors du déchargement de la page
		window.addEventListener('pagehide', sendWatchTime);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined')
		window.removeEventListener('pagehide', sendWatchTime);
		sendWatchTime();
	});

	function configureProvider() {
		const player = document.getElementById('player');
		if (player) {
			player.addEventListener('provider-change', (event) => {
				const provider = event.detail;
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

	async function onTimeUpdate(event: CustomEvent) {
		// Extrait le temps courant et la durée totale de la vidéo
		const { currentTime } = event.detail;
		const duration = event.target.duration;

		// Mise à jour de l'accumulation du temps de visionnage
		if (lastTime !== undefined) {
			const diff = currentTime - lastTime;
			// On s'assure que diff est positif et raisonnable (pour éviter des sauts anormaux)
			if (diff > 0 && diff < 5) {
				accumulatedWatchTime += diff;
			}
		}
		lastTime = currentTime;

		// Utilisation de l'accumulatedWatchTime pour déterminer si 30% de la vidéo a été visionnée
		if (!hasCountedView && duration > 0 && accumulatedWatchTime >= duration * 0.3) {
			hasCountedView = true;
			try {
				await fetch('/api/video/view', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id })
				});
				console.log('Vue enregistrée');
			} catch (err) {
				console.error('Erreur enregistrement vue', err);
			}
		}
	}
</script>

<media-player load="eager" id="player" playsInline viewType="video" streamType="on-demand" title={title}
							src={status === 'ready' ? `http://localhost/${src}/transcoded/master.m3u8` : `http://localhost/${src}/original.mp4`}
							class="md:h-full md:max-h-[80dvh]" keyTarget="document" {autoplay} oncan-load={() => playerReady = true}
							oncan-play={onPlayerReady} ontime-update={onTimeUpdate}>
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
