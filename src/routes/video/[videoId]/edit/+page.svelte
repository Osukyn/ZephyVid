<script lang="ts">
	// On utilise "lucide-svelte" pour les icônes
	import {
		Pencil,
		ImageIcon,
		Eye,
		MessageSquare,
		Upload,
		Check,
		Share2,
		PlaySquare,
		Clock,
		Settings,
		Info,
		ThumbsUp, ExternalLink
	} from 'lucide-svelte';
	import Player from '$lib/components/Player.svelte';
	import Comment from '$lib/components/Comment.svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import AutocompleteMultiUser from '$lib/components/AutocompleteMultiUser.svelte';
	import type { User } from '$lib/server/db/schema';
	import { formatDuration } from '$lib/utils/Duration.js';
	import { formatDateToLocal } from '$lib/utils/Date';

	// Données récupérées côté serveur via load
	export let data: {
		videoId: string;
		videoData: {
			title: string;
			description: string;
			allowDownloads: boolean;
			thumbnail: string;
			sourceFilePath: string;
			status: string;
			visibility: string;
			viewCount: number;
			updatedAt: Date;
		};
		comments: any;
		allowedUsers?: Array<User>;
		likeData: { likes: number; dislikes?: number; userLike?: number };
		averageWatchDuration?: number;
		watchDuration?: number;
	};

	// État initial à partir des données en base
	let activeTab = 'details';
	let selectedThumbnail = data.videoData.thumbnail ? 5 : 0;
	let visibility = data.videoData.visibility;
	let hasChanges = false;
	let copied = false;
	let progress = 0;
	let formData = {
		title: data.videoData.title,
		description: data.videoData.description,
		allowDownloads: data.videoData.allowDownloads,
		thumbnail: data.videoData.thumbnail
	};
	let selectedUsers: Array<User> = data.allowedUsers ? [...data.allowedUsers] : [];

	// Sauvegarde des valeurs initiales pour réinitialisation
	const originalFormData = { ...formData };
	const originalSelectedUsers = [...selectedUsers];
	const originalVisibility = visibility;
	const originalSelectedThumbnail = selectedThumbnail;

	// Miniatures de base (récupérées depuis la vidéo)
	let baseThumbnails =
		[
			`http://localhost/${data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_001.jpg`,
			`http://localhost/${data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_002.jpg`,
			`http://localhost/${data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_003.jpg`,
			`http://localhost/${data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_004.jpg`,
			`http://localhost/${data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_005.jpg`
		];

	if (data.videoData.thumbnail) baseThumbnails.push(`http://localhost/${data.videoData.thumbnail}`);

	// Variable pour stocker l'URL de la miniature personnalisée uploadée
	let customThumbnailUrl: string | null = null;
	let customThumbnail: File | null = null;

	// Variable réactive combinant les miniatures de base et la miniature personnalisée
	$: allThumbnails = customThumbnailUrl ? [...baseThumbnails.slice(0, 5), customThumbnailUrl] : baseThumbnails;

	const comments = data.comments || [];
	let source = data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/');

	// Fonction de mise à jour des champs qui déclenche hasChanges
	const handleChange = (field, value) => {
		formData = { ...formData, [field]: value };
		hasChanges = true;
	};

	const handleThumbnailSelect = (index: number) => {
		selectedThumbnail = index;
		// Mettre à jour formData.thumbnail en fonction de la sélection
		formData.thumbnail = allThumbnails[index].split('/').slice(3).join('/');
		hasChanges = true;
	};

	const handleVisibilityChange = (value: string) => {
		visibility = value;
		hasChanges = true;
	};

	// Détection automatique des changements dans selectedUsers
	$: if (JSON.stringify(selectedUsers) !== JSON.stringify(originalSelectedUsers)) {
		hasChanges = true;
	}

	// Gestion de l'upload de la miniature personnalisée
	function handleThumbnailUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			// Stocke le fichier dans customThumbnail
			customThumbnail = target.files[0];
			// Crée un object URL pour l'aperçu et le stocker dans customThumbnailUrl
			customThumbnailUrl = URL.createObjectURL(customThumbnail);
			// Met à jour formData.thumbnail pour afficher l'aperçu
			formData.thumbnail = customThumbnailUrl;
			// Par exemple, on ajoute la miniature personnalisée à la fin de la liste
			selectedThumbnail = 5;
			hasChanges = true;
		}
	}

	// Bouton "Annuler" : réinitialise tous les champs aux valeurs d'origine
	function resetChanges() {
		formData = { ...originalFormData };
		selectedUsers = [...originalSelectedUsers];
		visibility = originalVisibility;
		customThumbnailUrl = null;
		selectedThumbnail = originalSelectedThumbnail;
		hasChanges = false;
	}

	async function publishChanges() {
		if (customThumbnail && selectedThumbnail === 5) {
			const form = new FormData();
			form.append('videoId', data.videoId);
			form.append('title', formData.title);
			form.append('description', formData.description);
			form.append('allowDownloads', formData.allowDownloads.toString());
			form.append('visibility', visibility);
			form.append('allowedUsers', JSON.stringify(selectedUsers.map(u => u.id)));
			form.append('thumbnail', customThumbnail);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/video/edit');

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					progress = event.loaded / event.total;
				}
			};

			xhr.onload = () => {
				if (xhr.status === 200) {
					hasChanges = false;
					progress = 1;
					data.videoData.updatedAt = new Date();
					setTimeout(() => {
						progress = 0;
					}, 1000);
				} else {
					console.error('Erreur lors de la publication', xhr.statusText);
				}
			};

			xhr.onerror = () => {
				console.error('Erreur lors de l\'envoi');
			};

			xhr.send(form);
		} else {
			// Votre code existant pour l'envoi en JSON
			const payload = {
				videoId: data.videoId,
				...formData,
				allowDownloads: formData.allowDownloads ? 1 : 0,
				visibility,
				allowedUsers: selectedUsers.map(u => u.id)
			};
			try {
				const res = await fetch('/api/video/edit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (res.ok) {
					hasChanges = false;
					data.videoData.updatedAt = new Date();
				} else {
					console.error('Erreur lors de la publication');
				}
			} catch (err) {
				console.error('Erreur lors de la publication', err);
			}
		}
	}

	function copyText(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<div class="overflow-auto h-full bg-base-200">
	<div class="container mx-auto p-4 pb-24 max-w-[1600px]">
		<div class="grid grid-cols-12 gap-6">
			<!-- Sidebar gauche – Infos vidéo -->
			<div class="col-span-12 lg:col-span-8 space-y-6">
				<!-- Aperçu de la vidéo -->
				<div class="bg-base-100 rounded-box p-6">
					<div class="aspect-video rounded-lg overflow-hidden bg-base-300">
						<Player
							src={source}
							status={data.videoData.status}
							title={data.videoData.title}
							poster={`http://localhost/${data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_001.jpg`}
							id={data.videoId}
							autoplay={false}
						/>
					</div>
				</div>

				<!-- Navigation par onglets -->
				<div class="tabs tabs-boxed">
					<button class="tab {activeTab === 'details' ? 'tab-active' : ''}" onclick={() => (activeTab = "details")}>
						<Pencil class="w-4 h-4 mr-2" />
						Détails
					</button>
					<button class="tab {activeTab === 'thumbnails' ? 'tab-active' : ''}"
									onclick={() => (activeTab = "thumbnails")}>
						<ImageIcon class="w-4 h-4 mr-2" />
						Miniatures
					</button>
					<button class="tab {activeTab === 'visibility' ? 'tab-active' : ''}"
									onclick={() => (activeTab = "visibility")}>
						<Eye class="w-4 h-4 mr-2" />
						Visibilité
					</button>
					<button class="tab {activeTab === 'comments' ? 'tab-active' : ''}" onclick={() => (activeTab = "comments")}>
						<MessageSquare class="w-4 h-4 mr-2" />
						Commentaires
					</button>
				</div>

				<!-- Contenu des onglets -->
				<div class="bg-base-100 rounded-box p-6">
					{#if activeTab === "details"}
						<div class="space-y-6">
							<div class="form-control w-full">
								<label class="label">
									<span class="label-text">Titre de la vidéo</span>
								</label>
								<input type="text" placeholder="Entrez le titre" class="input input-bordered w-full"
											 bind:value={formData.title} oninput={(e) => handleChange("title", e.target.value)} />
							</div>
							<div class="form-control w-full">
								<label class="label">
									<span class="label-text">Description</span>
								</label>
								<textarea class="textarea textarea-bordered h-32" placeholder="Décrivez votre vidéo"
													bind:value={formData.description}
													oninput={(e) => handleChange("description", e.target.value)}>
								</textarea>
							</div>
							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Autoriser les téléchargements</span>
									<input type="checkbox" class="toggle toggle-primary"
												 checked={formData.allowDownloads}
												 onchange={(e) => handleChange("allowDownloads", e.target.checked)} />
								</label>
							</div>
						</div>
					{/if}

					{#if activeTab === "thumbnails"}
						<div class="space-y-6">
							<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
								{#each allThumbnails as thumbnail, index}
									<div
										class="relative cursor-pointer rounded-lg overflow-hidden group {selectedThumbnail === index ? 'ring-2 ring-primary' : ''}"
										onclick={() => handleThumbnailSelect(index)}>
										<img src={thumbnail || "/placeholder.svg"} alt={"Miniature " + (index + 1)}
												 class="w-full aspect-video object-cover" />
										<div
											class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<span class="text-white text-sm">Sélectionner</span>
										</div>
										{#if selectedThumbnail === index}
											<div class="absolute top-2 right-2">
												<div class="badge badge-primary">
													<Check class="w-4 h-4" />
												</div>
											</div>
										{/if}
									</div>
								{/each}
								<!-- Champ d'import pour une nouvelle miniature -->
								<div
									class="relative aspect-video rounded-lg border-2 border-dashed border-base-content/20 flex items-center justify-center hover:border-primary/50 transition-colors">
									<input type="file" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*"
												 onchange={handleThumbnailUpload} />
									<div class="text-center">
										<Upload class="w-8 h-8 mx-auto mb-2 text-base-content/50" />
										<p class="text-sm text-base-content/50">Importer une miniature</p>
									</div>
								</div>
							</div>
							<div class="alert">
								<Info class="w-4 h-4" />
								<span>Conseil: Choisissez une miniature attrayante qui représente bien le contenu de votre vidéo</span>
							</div>
						</div>
					{/if}

					{#if activeTab === "visibility"}
						<div class="space-y-6">
							<div class="space-y-4">
								<div class="flex items-start space-x-3">
									<input type="radio" name="visibility" class="radio radio-primary mt-1"
												 checked={visibility === "private"} onchange={() => handleVisibilityChange("private")} />
									<div>
										<h3 class="font-medium">Privé</h3>
										<p class="text-sm text-base-content/70">Vous seul pouvez voir cette vidéo</p>
									</div>
								</div>
								<div class="flex items-start space-x-3">
									<input type="radio" name="visibility" class="radio radio-primary mt-1"
												 checked={visibility === "unlisted"} onchange={() => handleVisibilityChange("unlisted")} />
									<div>
										<h3 class="font-medium">Non répertorié</h3>
										<p class="text-sm text-base-content/70">Toute personne disposant du lien peut voir la vidéo</p>
									</div>
								</div>
								<div class="flex items-start space-x-3">
									<input type="radio" name="visibility" class="radio radio-primary mt-1"
												 checked={visibility === "personalised"}
												 onchange={() => handleVisibilityChange("personalised")} />
									<div class="flex-1">
										<h3 class="font-medium">Personnalisé</h3>
										<p class="text-sm text-base-content/70 mb-2">Choisissez qui peut voir cette vidéo</p>
										<div class="space-y-2">
											{#if visibility === 'personalised'}
												<AutocompleteMultiUser bind:selectedUsers />
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}

					{#if activeTab === "comments"}
						<div class="space-y-6">
							<div class="flex items-center justify-between">
								<h3 class="font-medium">Commentaires ({comments.length})</h3>
							</div>
							<div class="divider"></div>
							<div class="space-y-4">
								{#if comments.length === 0}
									<p class="text-sm text-gray-500 text-center">Aucun commentaire pour le moment</p>
								{:else}
									<div class="flex flex-col gap-4 w-full">
										{#each comments as comment, i (comment.id)}
											<div id={comment.id} transition:fade={{ duration: 100 }} animate:flip={{ duration: 100 }}>
												<Comment bind:comment={comments[i]} videoOwner={data.user} user={data.user} />
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Sidebar droite – Statistiques & Liens de partage -->
			<div class="col-span-12 lg:col-span-4 space-y-6">
				<div class="bg-base-100 rounded-box p-6">
					<h3 class="font-medium mb-4">Statistiques rapides</h3>
					<div class="stats stats-vertical shadow w-full">
						<div class="stat">
							<div class="stat-figure text-primary">
								<PlaySquare class="w-8 h-8" />
							</div>
							<div class="stat-title">Vues totales</div>
							<div class="stat-value">{data.videoData.viewCount}</div>
						</div>
						<div class="stat">
							<div class="stat-figure text-primary">
								<Clock class="w-8 h-8" />
							</div>
							<div class="stat-title">Temps de visionnage moyen</div>
							<div class="stat-value">{formatDuration(data.averageWatchDuration)}</div>
						</div>
						<div class="stat">
							<div class="stat-figure text-primary">
								<Clock class="w-8 h-8" />
							</div>
							<div class="stat-title">Temps de visionnage total</div>
							<div class="stat-value">{formatDuration(data.watchDuration)}</div>
						</div>
						<div class="stat">
							<div class="stat-figure text-primary">
								<ThumbsUp class="w-8 h-8" />
							</div>
							<div class="stat-title">Likes</div>
							<div class="stat-value">{data.likeData.likes}</div>
						</div>
					</div>
				</div>
				<div class="bg-base-100 rounded-box p-6">
					<h3 class="font-medium mb-4">Liens de partage</h3>
					<div class="space-y-4">
						<div class="form-control">
							<label class="label">
								<span class="label-text">Lien de la vidéo</span>
							</label>
							<div class="join w-full">
								<input type="text" class="input input-bordered join-item w-full"
											 value="http://localhost:5173/video/{data.videoId}" readonly />
								<div class="tooltip transition-colors ease-in-out delay-100 { copied ? ' tooltip-success' : ''}"
										 data-tip={copied ? "Copié !" : "Copier le code"}>
									<button class="btn join-item" onclick={() => copyText(`http://localhost:5173/video/${data.videoId}`)}>
										Copier
									</button>
								</div>
							</div>
						</div>
						<div class="form-control">
							<label class="label">
								<span class="label-text">Code d'intégration</span>
							</label>
							<div class="join w-full">
								<input type="text" class="input input-bordered join-item w-full"
											 value='<iframe src="http://localhost:5173/video/{data.videoId}"></iframe>' readonly />
								<div class="tooltip transition-colors ease-in-out delay-100 { copied ? ' tooltip-success' : ''}"
										 data-tip={copied ? "Copié !" : "Copier le code"}>
									<button class="btn join-item"
													onclick={() => copyText(`<iframe src="http://localhost:5173/video/${data.videoId}"></iframe>`)}>
										Copier
									</button>
								</div>

							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div
		class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-neutral-700 p-4 flex justify-between items-center animate-in slide-in-from-bottom duration-300">
		<div class="flex items-center gap-2">
			<div
				class="badge{hasChanges ? ' badge-neutral' : ' badge-primary'}">{ hasChanges ? 'Brouillon' : 'Enregistré' }</div>
			<span class="text-sm text-base-content/70">
					Dernière modification le {formatDateToLocal(data.videoData.updatedAt)}
				</span>
		</div>
		<div class="flex gap-2">
			<a href="/video/{data.videoId}" class="btn btn-ghost gap-2">
				<ExternalLink className="w-4 h-4" />
				Voir la vidéo
			</a>
			<button class="btn btn-ghost" onclick={resetChanges} disabled={!hasChanges}>Annuler</button>
			<button class="btn btn-primary" onclick={publishChanges} disabled={!hasChanges}>
				Publier les modifications
			</button>
		</div>
		{#if customThumbnail && progress > 0}
			<progress class="absolute bottom-0 progress-bar progress progress-primary w-full transition-all"
								value={progress} max="100"></progress>
		{/if}
	</div>
</div>
