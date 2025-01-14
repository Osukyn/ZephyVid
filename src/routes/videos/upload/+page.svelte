<script lang="ts">

	import { goto } from '$app/navigation';
	import AutocompleteMultiUser from '$lib/components/AutocompleteMultiUser.svelte';

	let title = $state('');
	let description = $state('');
	let file: File | null = null;
	let isUploading = $state(false);
	let uploadProgress = 0;
	let xhr: XMLHttpRequest | null = null; // pour pouvoir annuler
	let selectedUsers: Array<User> = $state([]);

	/**
	 * Quand l'utilisateur sélectionne un fichier.
	 */
	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		file = input.files?.[0] ?? null;
	}

	/**
	 * Soumission du formulaire "manuelle" (on empêche le POST classique).
	 */
	async function handleSubmit(event: Event) {
		event.preventDefault(); // Empêche le POST HTML standard
		if (!file) {
			alert('Aucun fichier sélectionné');
			return;
		}

		isUploading = true;
		uploadProgress = 0;

		xhr = new XMLHttpRequest();
		xhr.open('POST', '/videos/upload');
		// -> ça va taper dans ++server.ts (POST /videos/upload)

		const blobby = document.getElementById('blob');
		const blobbyOut = document.getElementById('blobbyOut');
		if (blobbyOut) {
			blobbyOut.style.background = 'black';
			blobbyOut.style.backgroundColor = '#140F0F';
		}

		// Événement de progression (upload)
		xhr.upload.onprogress = (ev) => {
			if (ev.lengthComputable) {
				uploadProgress = Math.round((ev.loaded / ev.total) * 100);
				if (blobby) {
					blobby.style.height = uploadProgress + '%';
				}
			}
		};

		// Fin de l'upload
		xhr.onload = () => {
			isUploading = false;
			if (xhr && xhr.status >= 200 && xhr.status < 300) {
				if (blobby) blobby.style.height = '100%'; // Finir le blob
				// On pourrait réinitialiser les champs ou rediriger, etc.
				goto('/videos');
			} else {
				alert('Erreur lors de l’upload : ' + xhr?.statusText);
			}
		};

		xhr.onerror = () => {
			isUploading = false;
			alert('Erreur réseau ou serveur injoignable.');
		};

		// Construire le FormData
		const formData = new FormData();
		formData.append('title', title);
		formData.append('description', description);
		formData.append('videoFile', file);
		formData.append('visibility', visibility);
		if (visibility === 'personalised') {
			formData.append('allowedUsers', JSON.stringify(selectedUsers.map(u => u.id)));
		}

		// Envoyer
		xhr.send(formData);
	}

	/**
	 * Annuler l’upload
	 */
	function cancelUpload() {
		if (xhr && isUploading) {
			xhr.abort();
			isUploading = false;
			uploadProgress = 0;
		}
	}

	const visibilityInfo = {
		private: 'La vidéo ne sera visible que par vous',
		unlisted: 'La vidéo sera accessible à toute personne disposant du lien',
		personalised: 'La vidéo sera accessible uniquement aux personnes que vous autorisez'
	};

	let visibility = $state('private');
</script>

<div class="flex justify-evenly items-center h-full">
	<div class="card bg-base-300 w-[36rem] shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Mettre en ligne une vidéo</h2>
			<p class="mb-2">Remplissez ce formulaire pour mettre en ligne votre video</p>
			<form onsubmit={handleSubmit}>
				<label class="form-control w-full mb-2">
					<div class="label">
						<span class="label-text">Titre</span>
					</div>
					<input
						type="text"
						name="title"
						id="title"
						placeholder="Ajoutez un titre pour décrire votre vidéo"
						class="input input-bordered w-full"
						maxlength="100"
						bind:value={title}
						required
					/>
				</label>

				<label class="form-control mb-4">
					<div class="label">
						<span class="label-text">Description (optionnel)</span>
					</div>
					<textarea name="description"
										id="description"
										rows="3"
										bind:value={description} class="textarea textarea-bordered h-56 max-h-56 resize-none"
										placeholder="Présentez votre vidéo à vos spectateurs" maxlength="8192" ></textarea>
				</label>

				<input
					type="file"
					name="videoFile"
					id="videoFile"
					accept="video/mp4"
					class="file-input w-full mb-2"
					required
					onchange={handleFileChange}
				/>

				<label class="form-control">
					<div class="label">
						<span class="label-text">Visibilité</span>
					</div>
					<select name="visibility" id="visibility" class="select select-bordered w-full" bind:value={visibility} required>
						<option value="private" selected>Privée</option>
						<option value="unlisted">Non répertoriée</option>
						<option value="personalised">Personnalisée</option>
					</select>
					<div class="label">
						<div class="flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="stroke-base-content h-4 w-4 shrink-0">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span class="label-text-alt text-stone-400">{visibilityInfo[visibility]}</span>
						</div>
					</div>
				</label>

				{#if (visibility === 'personalised')}
					<AutocompleteMultiUser bind:selectedUsers={selectedUsers}  />
					<!--<label class="form-control">
						<div class="label">
							<span class="label-text">Personnes autorisées</span>
						</div>
						<input
							type="text"
							name="allowedUsers"
							id="allowedUsers"
							placeholder="Entrez les noms d'utilisateur des personnes autorisées"
							class="input input-bordered w-full"
							maxlength="100"
						/>
					</label>-->
				{/if}

				<div class="card-actions flex-nowrap space-x-8 mt-4">
					<button class="btn btn-primary grow" type="submit" disabled={isUploading}>Envoyer</button>
					<button class="btn btn-secondary grow" type="button" disabled={!isUploading} onclick={cancelUpload}>Annuler</button>
				</div>
			</form>
		</div>
	</div>

	<div class="flex justify-center items-center">
		<div id="blobbyOut" class="shape-outer">
			<div id="blob" class="shape-inner"></div>
		</div>
	</div>
</div>

<style>
    .shape-outer {
        position: relative;       /* pour que .shape-inner puisse être "absolu" dedans */
        width: 300px;
        height: 300px;
        border-radius: 50%;
        overflow: hidden;         /* important pour que .shape-inner ne dépasse pas */

        /* Couleur/gradient de base ou un simple fond */
        background: linear-gradient(
                27deg,
                #fff41b 0%,  /* jaune clair  */ #f8ba25 50%, /* légèrement orangé au milieu */ #f2860b 100% /* plus chaud et profond en fin */
        );

        /* Animation idle : keyframes "blobify" */
        animation: blobify 4s ease-in-out infinite;
    }

    /* Idle "blob" (ne dépend pas du pourcentage d’upload) */
    @keyframes blobify {
        0%, 100% {
            border-radius: 70% 30% 72% 28% / 27% 61% 39% 73%;
        }
        50% {
            border-radius: 77% 23% 54% 46% / 40% 38% 62% 60%;
        }
    }

    .shape-inner {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 0%; /* On commence vide (0%) */

        /* Le gradient "de remplissage" :
					 par ex. un dégradé vertical plus intense,
					 ou la même palette si tu veux garder la cohérence */
        background: linear-gradient(
                27deg,
                rgba(201, 242, 42, 1) 0%,
                rgba(29, 183, 83, 1) 50%,
                rgba(29, 183, 214, 1) 100%
        );

        /* Transition si tu veux un effet doux entre les % */
        transition: height 0.2s ease-out;

        /* Pour suivre la même forme "blob"?
					 => On peut ajouter un border-radius: 50%,
					 ou rien du tout, car c'est déjà masqué par overflow:hidden
					 de .shape-outer */
    }
</style>
