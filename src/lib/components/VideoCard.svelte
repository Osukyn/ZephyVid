<script lang="ts">
	import type { Video } from '$lib/server/db/schema';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { formatTimeAgoIntl } from '$lib/utils/Date.js';

	/**
	 * Props de la vidéo.
	 */
	export let video: Video;
	export let uploaderName: string = '';
	export let progress: { id: string, progress: number, status: string } = null;
	/**
	 * Callback pour avertir le parent
	 * lorsqu'on coche/décoche la checkbox.
	 * Par défaut, c'est une fonction vide (pour éviter les erreurs si non fourni)
	 */
	export let onDelete: (args: { videoId: string }) => void = () => {
	};

	let hovered: boolean = false;
	export let checked: boolean = false;
	let deleteConfirmation: boolean = false;

	/**
	 * Format personnalisé ?
	 * Tu peux transformer la date `uploadedAt` si tu veux (ex: new Date(...)).
	 * Ici, on laisse tel quel pour la démo, ou on applique un toLocaleDateString().
	 */
	$: displayDate = `${formatTimeAgoIntl(video.createdAt)}`;

	function handleDeleteConfirmation() {
		deleteConfirmation = true;
		setTimeout(() => {
			const confirmationElement = document.getElementById(`confirmation-${video.id}`);
			if (confirmationElement) {
				confirmationElement.children[0].animate(
					[
						{ opacity: 0, display: 'none', offset: 0 },
						{ opacity: 0, display: 'flex', offset: 0.75 },
						{ opacity: 1, display: 'flex', offset: 1 }
					],
					{
						duration: 200,
						easing: 'ease-out',
						fill: 'forwards'
					}
				);
				confirmationElement.animate(
					[
						{ height: '0' },
						{ height: '100%' }
					],
					{
						duration: 200,
						easing: 'ease-out',
						fill: 'forwards'
					}
				);
			}
		});
	}

	async function handleDeleteConfirmationResponse(deleteVideo: boolean) {
		setTimeout(() => {
			deleteConfirmation = false;
		}, 200);
		if (deleteVideo) {
			await fetch(`/api/video?id=${video.id}`, { method: 'DELETE' });
			onDelete({ videoId: video.id });
		} else {
			const confirmationElement = document.getElementById(`confirmation-${video.id}`);
			if (confirmationElement) {
				confirmationElement.children[0].animate(
					[
						{ opacity: 1 },
						{ opacity: 0, display: 'none' }
					],
					{
						duration: 50,
						easing: 'ease-out',
						fill: 'forwards'
					}
				);
				confirmationElement.animate(
					[
						{ height: '100%' },
						{ height: '0' }
					],
					{
						duration: 200,
						easing: 'ease-out',
						fill: 'forwards'
					}
				);
			}
		}
	}

	function playVideo() {
		goto(`/video/${video.id}`);
	}
</script>

<div id={video.id} class="relative">
	<div role="article"
			 class="card bg-black w-[22rem] shadow-xl border-2 {checked ? 'border-primary' : 'border-transparent'}"
			 onmouseenter={() => hovered = true} onmouseleave={() => hovered = false}>
		<figure>
			<div class="aspect-video w-full relative">
				<div class="flex justify-between h-6 items-center absolute top-4 left-4 right-4">
					{#if hovered || checked}
						<input id="check-{video.id}" type="checkbox" bind:checked={checked}
									 class="checkbox checkbox-primary z-10" />
					{/if}
					{#if hovered && !checked}
						<button class="btn btn-sm btn-square btn-ghost z-10 m-0" aria-label="Delete button"
										onclick={handleDeleteConfirmation}>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
									 stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
									 class="lucide lucide-trash-2">
								<path d="M3 6h18" />
								<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
								<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
								<line x1="10" x2="10" y1="11" y2="17" />
								<line x1="14" x2="14" y1="11" y2="17" />
							</svg>
						</button>
					{/if}
				</div>
				{#if hovered && (progress ? progress.status : 'pending') !== 'pending'}
					<div transition:fade={{duration: 100}}
							 class="absolute flex justify-center items-center w-full h-full bg-black bg-opacity-50">
						<button class="btn btn-square btn-lg btn-ghost" aria-label="Play button" onclick={playVideo}>
							<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
									 stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
									 class="lucide lucide-play">
								<polygon points="6 3 20 12 6 21 6 3" />
							</svg>
						</button>
					</div>
				{/if}
				{#if ((progress ? progress.status : 'pending') === 'pending')}
					<div
						class="absolute flex flex-col justify-center items-center w-full h-full bg-black bg-opacity-85">
						<p class="text-2xl font-bold text-center">Optimisation en cours</p>
						<p class="text-lg font-bold text-center text-secondary">{progress.progress}%</p>
					</div>
					<progress class=" absolute bottom-0 progress-bar progress progress-primary w-full transition-all"
										value={progress.progress} max="100"></progress>
				{/if}

				{#if video.thumbnail}
					<img src={video.thumbnail} alt="Thumbnail" class="object-cover aspect-video w-full" />
				{:else}
					{#if progress.progress >= 5 }
						<img
							src="http://localhost/{video.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_001.jpg"
							alt="Thumbnail" class="object-cover aspect-video w-full">
					{:else}
						<div class="object-cover aspect-video w-full bg-gray-700"></div>
					{/if}
				{/if}
			</div>
		</figure>
		<div class="card-body !p-6">
			<h2 class="card-title">{video.title}</h2>
			<p class="text-sm text-gray-500">
				<!-- Si on a un uploaderName, on l'affiche -->
				{#if uploaderName}
					<span>Par {uploaderName}, </span>
				{/if}
				<!-- Affichage de la date formatée -->
				<span>{displayDate}</span>
			</p>
		</div>
	</div>
	{#if deleteConfirmation}
		<div class="flex absolute justify-end top-0 right-0 left-0 bottom-0 z-20 card">
			<div id="confirmation-{video.id}" class="bg-base-300 w-full card justify-center items-center">
				<div class="card-body grow-0">
					<h2 class="card-title">Suppression</h2>
					<p>Êtes-vous sûr de vouloir supprimer cette vidéo ?</p>
					<div class="card-actions justify-evenly mt-4">
						<button class="btn btn-primary" onclick={() => handleDeleteConfirmationResponse(false)}>Annuler</button>
						<button class="btn btn-error" onclick={() => handleDeleteConfirmationResponse(true)}>Supprimer</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
    .progress::-webkit-progress-value {
        transition: width 0.3s ease; /* Animation pour les navigateurs WebKit (Chrome, Safari) */
    }

    .progress::-moz-progress-bar {
        transition: width 0.3s ease; /* Animation pour Firefox */
    }

    .progress-bar {
        transition: width 0.3s ease; /* Support pour des cas alternatifs */
    }
</style>
