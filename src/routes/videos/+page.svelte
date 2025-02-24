<script lang="ts">

	import VideoCard from '$lib/components/VideoCard.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	// Données en provenance du load (ex: data.videos)
	export let data: { videos: any[], usersVideos: any[] };

	// Dictionnaire des états "checked" (clé = video.id)
	// Par défaut, aucune vidéo cochée.
	let checkedMap: Record<string, boolean> = {};
	// Références sur l'élément DOM du master checkbox
	let masterCheckboxEl: HTMLInputElement | null = null;
	let deleteAllConfirmation: boolean = false;
	let videoProgressStatus: { id: string, progress: number, status: string }[];

	let inter;

	// Initialiser le dictionnaire quand la page se charge
	// (optionnel, si tu veux commencer avec tout à "false")
	onMount(async () => {
		for (const video of data.videos) {
			// si la clé n'existe pas déjà, on la crée
			if (checkedMap[video.id] === undefined) {
				checkedMap[video.id] = false;
			}
		}

		await getVideoProgress();

		inter = setInterval(async () => {
			await getVideoProgress();
		}, 5000);

		// On force la réactivité en recréant l'objet
		checkedMap = { ...checkedMap };
	});

	onDestroy(() => {
		if (inter) clearInterval(inter);
	});

	async function getVideoProgress() {
		const response = await fetch('/api/videos/progress');
		if (response.ok) {
			videoProgressStatus = await response.json();
		}
	}

	function handleDelete({ videoId }: { videoId: string }) {
		// Supprimer la vidéo du DOM après l'animation
		delete checkedMap[videoId];
		checkedMap = { ...checkedMap };

		data.videos = data.videos.filter((video) => video.id !== videoId);
	}

	/**
	 * Désélectionner toutes les vidéos
	 */
	function unselectAll() {
		for (const video of data.videos) {
			checkedMap[video.id] = false;
		}
		checkedMap = { ...checkedMap };
	}

	/**
	 * Bloc réactif: on recalcule le nombre de vidéos cochées
	 * dès que data.videos ou checkedMap changent.
	 */
	$: checkedCount = data.videos.reduce((acc, v) => acc + (checkedMap[v.id] ? 1 : 0), 0);

	// Déterminer si on a au moins une vidéo sélectionnée
	$: isAnyChecked = Object.values(checkedMap).some((val) => val === true);
	$: isNoChecked = Object.values(checkedMap).every((val) => val === false);

	$: if (isNoChecked) {
		deleteAllConfirmation = false;
	}

	// On recalcule l'état de la master checkbox à chaque fois que
	// `isAnyChecked` ou `checkedMap` changent, après insertion dans le DOM
	$: if (isAnyChecked) {
		// Le master checkbox vient d'apparaître (ou est déjà affiché)
		// On attend la fin du cycle pour que le <input> soit bien en DOM
		setTimeout(() => {
			updateMasterCheckbox(checkedCount, data.videos.length);
		});
	}


	/**
	 * Autre bloc réactif: on utilise checkedCount (et le total)
	 * pour mettre à jour la checkbox maître.
	 */
	$: {
		updateMasterCheckbox(checkedCount, data.videos.length);
	}

	function updateMasterCheckbox(checkedCount: number, total: number) {
		if (!masterCheckboxEl) return;

		if (checkedCount === 0) {
			// Aucune vidéo cochée
			masterCheckboxEl.checked = false;
			masterCheckboxEl.indeterminate = false;
		} else if (checkedCount === total) {
			// Toutes les vidéos cochées
			masterCheckboxEl.checked = true;
			masterCheckboxEl.indeterminate = false;
		} else {
			// partiellement coché
			masterCheckboxEl.checked = false;
			masterCheckboxEl.indeterminate = true;
		}
	}

	function handleMasterChange() {
		if (!masterCheckboxEl) return;
		const isChecked = masterCheckboxEl.checked;
		for (const vid of data.videos) {
			checkedMap[vid.id] = isChecked;
		}
		checkedMap = { ...checkedMap };
	}

	function handleDeleteAllConfirmation() {
		deleteAllConfirmation = true;

		setTimeout(() => {
			const confirmationElement = document.getElementById('delete-toolbar-override');
			if (confirmationElement) {
				confirmationElement.children[0].animate(
					[
						{ opacity: 0, display: 'none', offset: 0 },
						{ opacity: 0, display: 'flex', offset: 0.75 },
						{ opacity: 1, display: 'flex', offset: 1 }
					],
					{
						duration: 300,
						easing: 'ease-out',
						fill: 'forwards'
					}
				);
				confirmationElement.animate(
					[
						{ width: '0' },
						{ width: '100%' }
					],
					{
						duration: 300,
						easing: 'ease-out',
						fill: 'forwards'
					}
				);
			}
		});
	}

	function handleDeleteAllConfirmationCancel() {

		const confirmationElement = document.getElementById('delete-toolbar-override');
		if (confirmationElement) {
			confirmationElement.children[0].animate(
				[
					{ opacity: 1 },
					{ opacity: 0, display: 'none' }
				],
				{
					duration: 75,
					easing: 'ease-out',
					fill: 'forwards'
				}
			);
			confirmationElement.animate(
				[
					{ width: '100%' },
					{ width: '0' }
				],
				{
					duration: 300,
					easing: 'ease-out',
					fill: 'forwards'
				}
			);
		}

		setTimeout(() => {
			deleteAllConfirmation = false;
		}, 300);
	}

	function handleDeleteAllConfirmationConfirmed() {
		fetch(`/api/video?ids=${Object.keys(checkedMap).filter((key) => checkedMap[key] === true).toString()}`, {
			method: 'DELETE'
		});

		const temp = { ...checkedMap };
		for (const videoId in temp) {
			if (temp[videoId] === true) {
				handleDelete({ videoId });
			}
		}
	}
</script>
<div class="px-16 py-4 overflow-auto">
	<h1 class="text-2xl mb-6">Mes vidéos <span class="text-stone-400"><strong>·</strong> {data.videos.length}</span></h1>

	{#if (videoProgressStatus)}
		<div class="flex flex-wrap gap-4 overflow-y-auto">
			{#each data.videos as video (video.id)}
				<div
					id={video.id}
					in:fade={{ duration: 100 }}
					animate:flip={{duration: 100}}
					class="w-fit h-fit relative"
				>
					<VideoCard {video} onDelete={handleDelete} bind:checked={checkedMap[video.id]}
										 progress={videoProgressStatus.find(progressData => progressData.id === video.id)} user={data.user} />
				</div>
			{/each}
		</div>
	{/if}

	{#if data.videos.length === 0}
		<p class="text-center text-stone-400">Aucune vidéo trouvée</p>
	{/if}

	{#each Object.values(data.usersVideos) as videos}
		<h2 class="text-2xl mt-8 mb-6">Vidéos de <strong>{videos[0].owner.username}</strong> <span class="text-stone-400"><strong>·</strong> {videos.length}</span></h2>
		<div class="flex flex-wrap gap-4 overflow-y-auto">
			{#each videos as video}
				<div
					in:fade={{ duration: 100 }}
					class="w-fit h-fit relative"
				>
					<VideoCard {video} user={data.user} />
				</div>
			{/each}
		</div>
	{/each}


	{#if isAnyChecked}
		<div transition:fly={{y: 16, duration: 100}}
				 class="flex justify-center items-center absolute left-4 right-4 bottom-4">
			<div class="relative flex items-center justify-between bg-base-300 rounded-2xl p-4 min-w-64 w-96">
				<div class="flex items-center space-x-4">
					<input
						type="checkbox"
						class="checkbox checkbox-primary"
						bind:this={masterCheckboxEl}
						onchange={handleMasterChange}
					/>
					<p class="mr-2">{Object.values(checkedMap).filter((val) => val === true).length}
						vidéo{Object.values(checkedMap).filter((val) => val === true).length > 1 ? 's' : ''}</p>
				</div>

				<button class="absolute btn btn-square btn-sm btn-ghost left-1/2 -translate-x-1/2"
								aria-label="Delete all button"
								onclick={handleDeleteAllConfirmation}>
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
				<button class="btn btn-primary btn-sm ml-auto" onclick={unselectAll}>Annuler</button>
			</div>
			{#if deleteAllConfirmation}
				<div class="absolute flex justify-end w-96 z-10 h-full">
					<div id="delete-toolbar-override" class="flex items-center bg-base-300 rounded-2xl h-full w-0">
						<div class="flex justify-between items-center p-4 h-full w-full opacity-0">
							<p class="mr-2 text-nowrap">Supprimer {Object.values(checkedMap).filter((val) => val === true).length}
								vidéo{Object.values(checkedMap).filter((val) => val === true).length > 1 ? 's' : ''} ?</p>
							<button class="btn btn-primary btn-sm" onclick={handleDeleteAllConfirmationConfirmed}>Confirmer</button>
							<button class="btn btn-error btn-sm" onclick={handleDeleteAllConfirmationCancel}>Annuler</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
<style>
    .btn-ghost,
    .btn-ghost:focus,
    .btn-ghost:active {
        transform: translateX(-50%) !important;
        transition: none !important;
        transform-origin: center center;
    }
</style>
