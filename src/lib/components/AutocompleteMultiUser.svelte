<script lang="ts">
	import type { User } from '$lib/server/db/schema';
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatProfileImage } from '$lib/utils/Avatar';

	// Valeur saisie dans le champ
	let searchTerm: string = $state('');

	// Liste des utilisateurs qu'on nous remonte de l'API quand on tape
	let matchingUsers: Array<User> = $state([]);

	// Liste des utilisateurs *sélectionnés*
	let { selectedUsers = $bindable([]) }: { selectedUsers: Array<User> } = $props();

	// Index de l'élément "focus" dans la liste
	let activeIndex: number = $state(-1);

	// Petite fonction pour fetch la liste des utilisateurs
	async function fetchMatchingUsers(query: string): Promise<Array<User>> {
		if (!query) return [];
		const url = `/api/users/search?query=${encodeURIComponent(query)}`;
		try {
			const res = await fetch(url);
			if (!res.ok) {
				console.error('Erreur lors de la recherche des utilisateurs');
				return [];
			}
			return await res.json(); // On s'attend à un tableau d'utilisateurs
		} catch (error) {
			console.error('Erreur fetchMatchingUsers', error);
			return [];
		}
	}

	let typingTimeout: ReturnType<typeof setTimeout> | undefined;

	async function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;
		activeIndex = -1; // Réinitialiser la sélection quand on tape

		// Si peu de caractères, on vide la liste
		if (searchTerm.length < 2) {
			matchingUsers = [];
			return;
		}

		// Debounce : on attend un petit délai avant de fetch
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(async () => {
			matchingUsers = await fetchMatchingUsers(searchTerm);
			// Après fetch, on remet l’activeIndex à -1
			activeIndex = -1;
		}, 300);
	}

	function selectUser(user: User) {
		// Vérifier qu’il n’est pas déjà dans selectedUsers
		if (!selectedUsers.some(u => u.id === user.id)) {
			selectedUsers = [...selectedUsers, user];
		}
		// On reset le champ
		searchTerm = '';
		matchingUsers = [];
		activeIndex = -1;
	}

	function removeUser(userId: string) {
		selectedUsers = selectedUsers.filter(u => u.id !== userId);
	}

	// Gérer la touche Entrée + flèches
	async function handleKeyDown(event: KeyboardEvent) {
		const key = event.key;
		const matchingUsersFiltered = matchingUsers.filter(u => selectedUsers.findIndex(su => su.id === u.id) === -1);

		// Si la liste de suggestions est vide, on applique la logique "classique"
		// ( Entrée => recherche d'utilisateur par searchTerm )
		if (matchingUsersFiltered.length === 0) {
			if (key === 'Enter') {
				event.preventDefault();
				if (!searchTerm) return;
				await handleEnterWithoutSuggestions();
			}
			return;
		}

		// Sinon, on gère la navigation dans matchingUsers
		if (key === 'ArrowDown') {
			event.preventDefault();
			if (activeIndex < matchingUsersFiltered.length - 1) {
				activeIndex++;
			} else {
				activeIndex = 0; // ou bien rester à la fin
			}
		} else if (key === 'ArrowUp') {
			event.preventDefault();
			if (activeIndex > 0) {
				activeIndex--;
			} else {
				activeIndex = matchingUsersFiltered.length - 1; // ou rester à 0
			}
		} else if (key === 'Enter') {
			event.preventDefault();
			// Si on a un item sélectionné
			if (activeIndex >= 0 && activeIndex < matchingUsersFiltered.length) {
				selectUser(matchingUsersFiltered[activeIndex]);
			} else {
				// Aucune sélection, on tente la logique "classique"
				await handleEnterWithoutSuggestions();
			}
		}
	}

	async function handleEnterWithoutSuggestions() {
		// Vérifier si l'utilisateur existe déjà dans matchingUsers
		let userFound = matchingUsers.find(u =>
			u.username.toLowerCase() === searchTerm.toLowerCase() ||
			u.email.toLowerCase() === searchTerm.toLowerCase()
		);

		if (!userFound) {
			// On peut tenter un fetch direct par email/username exact
			const url = `/api/users/findOne?query=${encodeURIComponent(searchTerm)}`;
			try {
				const res = await fetch(url);
				if (res.ok) {
					userFound = await res.json();
				}
			} catch (error) {
				console.error('Erreur handleEnterWithoutSuggestions:', error);
			}
		}

		// Si on a trouvé un user, on le sélectionne
		if (userFound) {
			selectUser(userFound);
		} else {
			console.warn(`Aucun utilisateur trouvé pour "${searchTerm}".`);
			// Optionnel : afficher un message d'erreur ou un toast
		}
	}
</script>

<div class="form-control w-full max-w-xl">
	<label class="label">
		<span class="label-text">Partager avec</span>
	</label>

	<div class="relative">
		<!-- Liste des utilisateurs déjà sélectionnés -->
		<div class="flex flex-wrap gap-2 mb-2">
			{#each selectedUsers as user}
				<div class="badge badge-primary !pl-1 flex items-center gap-2 h-10">
					<Avatar
						avatarUrl={formatProfileImage(user.profileImage)}
						fallbackName={user.username}></Avatar>
					<strong>{user.username}</strong>
					<!-- Bouton pour retirer la personne -->
					<button
						type="button"
						class="btn btn-xs btn-circle ml-1"
						onclick={() => removeUser(user.id)}
					>
						✕
					</button>
				</div>
			{/each}
		</div>

		<!-- Champ de saisie principal -->
		<input
			class="input input-bordered w-full"
			type="text"
			placeholder="Saisir un pseudo ou un email"
			bind:value={searchTerm}
			oninput={handleInput}
			onkeydown={handleKeyDown}
		/>

		<!-- Liste déroulante d'autocomplétion -->
		{#if matchingUsers.filter(u => selectedUsers.findIndex(su => su.id === u.id) === -1).length > 0 && searchTerm.length >= 2}
			<ul class="absolute left-0 top-full w-full bg-neutral shadow-lg p-2 z-10 mt-1 rounded-xl overflow-hidden">
				{#each matchingUsers.filter(u => selectedUsers.findIndex(su => su.id === u.id) === -1) as user, i}
					<li
						class="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-opacity-30 bg-gray-400 bg-opacity-0 transition-colors rounded-lg"
						class:selected={i === activeIndex}
						onclick={() => selectUser(user)}
					>
						<Avatar
							avatarUrl={formatProfileImage(user.profileImage)}
							fallbackName={user.username}
							fallbackColor="primary"></Avatar>
						<span>{user.username}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style lang="postcss">
    .selected {
        @apply bg-gray-400 bg-opacity-15;
    }
</style>
