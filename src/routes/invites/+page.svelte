<script lang="ts">
	import { Copy, Plus, Loader2, Check, X, Trash, Users, Clock } from 'lucide-svelte';
	import { formatDateToLocal } from '$lib/utils/Date';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data, form } = $props();

	// Function to generate a random code
	function generateRandomCode(length = 10): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		return Array.from({ length }, () =>
			chars.charAt(Math.floor(Math.random() * chars.length))
		).join('');
	}

	// Local state variables
	let showCreateModal = $state(false);
	let showUsagesModal = $state(false);
	let loading = $state(false);
	let copySuccess: string | null = $state(null);
	let newInvitation = $state({
		code: '',
		maxUses: 1,
		expiresIn: 'never', // "never", "24h", "7d", "30d", "custom"
		customExpiration: ''
	});
	let invitationDeleteId: string | null = $state(null);
	let selectedInvitation = $state(null);

	// Example data for invitations
	let invitations = $state(data.invites);

	$effect(() => {
		if (form && form.data) {
			if (form.data.inviteId) {
				const filtered = invitations.filter(invitation => invitation.id !== form.data.inviteId);
				if (filtered.length !== invitations.length) {
					invitations = filtered;
				}
			} else if (!invitations.find(invitation => invitation.id === form.data.id)) {
				invitations.push(form.data);
			}
		}
	});

	onMount(() => {
		console.log(data.invites);
	});

	async function handleCopy(code: string) {
		try {
			await navigator.clipboard.writeText(code);
			copySuccess = code;
			setTimeout(() => (copySuccess = null), 2000);
		} catch (err) {
			console.error('Échec de la copie', err);
		}
	}

	function handleCreateInvitation() {
		return async ({ update, result }) => {
			loading = true;
			update().then(() => {
				loading = false;
				showCreateModal = false;
				// Reset form
				newInvitation = {
					code: generateRandomCode(),
					maxUses: 1,
					expiresIn: 'never',
					customExpiration: ''
				};
			});
		};
	}

	function isInvitationValid(invitation): boolean {
		const notExpired = !invitation.expiresAt || invitation.expiresAt > new Date();
		const hasUses = invitation.usedBy.length || 0 < invitation.maxUses;
		return notExpired && hasUses;
	}

	const handleShowUsages = (invitation) => {
		selectedInvitation = invitation;
		showUsagesModal = true;
	};
</script>

<div class="overflow-auto h-full bg-base-200 p-4">
	<div class="container mx-auto max-w-6xl">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
			<div>
				<h1 class="text-2xl font-bold">Gestion des invitations</h1>
				<p class="text-base-content/70">Créez et gérez vos codes d'invitation</p>
			</div>
			<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
				<Plus class="w-4 h-4 mr-2" />
				Nouvelle invitation
			</button>
		</div>

		<!-- Statistics -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">Invitations actives</div>
					<div class="stat-value text-primary">
						{invitations.filter(isInvitationValid).length}
					</div>
				</div>
			</div>
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">Utilisations totales</div>
					<div class="stat-value">{invitations.reduce((acc, inv) => acc + inv.usedBy.length || 0, 0)}</div>
				</div>
			</div>
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">Places restantes</div>
					<div class="stat-value">
						{invitations.reduce((acc, inv) => acc + (inv.maxUses - inv.usedBy.length || 0), 0)}
					</div>
				</div>
			</div>
		</div>

		<!-- Invitations table -->
		<div class="bg-base-100 rounded-box shadow-xl">
			<table class="table table-zebra">
				<thead>
				<tr>
					<th>Code</th>
					<th>Utilisations</th>
					<th class="hidden sm:table-cell">Créé le</th>
					<th class="hidden md:table-cell">Expire le</th>
					<th>Statut</th>
					<th>Actions</th>
				</tr>
				</thead>
				<tbody>
				{#each data.invites as invitation (invitation.id)}
					<tr animate:flip={{duration: 100}}>
						<td class="font-mono">{invitation.code}</td>
						<td>{invitation.usedBy.length || 0} / {invitation.maxUses}</td>
						<td class="hidden sm:table-cell">
							{formatDateToLocal(invitation.createdAt)}
						</td>
						<td class="hidden md:table-cell">
							{invitation.expiresAt ? formatDateToLocal(invitation.expiresAt) : "Jamais"}
						</td>
						<td>
							{#if isInvitationValid(invitation)}
                  <span class="badge badge-success gap-1">
                    <Check class="w-3 h-3" />
                    Actif
                  </span>
							{:else}
                  <span class="badge badge-error gap-1">
                    <X class="w-3 h-3" />
                    Expiré
                  </span>
							{/if}
						</td>
						<td>
							<div class="flex gap-2">
								<button class="btn btn-square btn-sm btn-ghost" onclick={() => handleCopy(invitation.code)}>
									{#if copySuccess === invitation.code}
										<Check class="w-4 h-4 text-success" />
									{:else}
										<Copy class="w-4 h-4" />
									{/if}
								</button>
								<button class="btn btn-square btn-sm btn-ghost" onclick={() => handleShowUsages(invitation)}>
									<Users className="w-4 h-4" />
								</button>
								<button class="btn btn-square btn-sm" onclick={() => {
									invitationDeleteId = invitation.id;
									document.getElementById('deleteModal')?.showModal();
								}}>
									<Trash class="w-4 h-4 text-danger" />
								</button>

							</div>
						</td>
					</tr>
				{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Create invitation modal -->
	{#if showCreateModal}
		<dialog class="modal modal-open">
			<div class="modal-box">
				<h3 class="font-bold text-lg mb-4">Créer une nouvelle invitation</h3>
				<form method="post" action="?/inviteCreate" use:enhance={handleCreateInvitation}>
					<div class="form-control">
						<label class="label">
							<span class="label-text">Code d'invitation</span>
						</label>
						<div class="join w-full">
							<input
								type="text"
								class="input input-bordered join-item w-full"
								name="code"
								placeholder="Code d'invitation"
								bind:value={newInvitation.code}
								required
							/>
							<button type="button" class="btn join-item" onclick={() => newInvitation.code = generateRandomCode()}>
								Générer
							</button>
						</div>
					</div>
					<div class="space-y-4 mt-4">
						<div class="form-control">
							<label class="label">
								<span class="label-text">Nombre d'utilisations maximum</span>
							</label>
							<input
								type="number"
								min="1"
								name="maxUses"
								class="input input-bordered"
								bind:value={newInvitation.maxUses}
							/>
						</div>
						<div class="form-control">
							<label class="label">
								<span class="label-text">Expiration</span>
							</label>
							<select name="expiresIn" class="select select-bordered w-full" bind:value={newInvitation.expiresIn}>
								<option value="never">Jamais</option>
								<option value="24h">24 heures</option>
								<option value="7d">7 jours</option>
								<option value="30d">30 jours</option>
								<option value="custom">Personnalisé</option>
							</select>
						</div>
						{#if newInvitation.expiresIn === "custom"}
							<div class="form-control">
								<label class="label">
									<span class="label-text">Date d'expiration</span>
								</label>
								<input
									type="datetime-local"
									class="input input-bordered"
									name="expiresInCustom"
									bind:value={newInvitation.customExpiration}
								/>
							</div>
						{/if}
					</div>
					<div class="modal-action">
						<button type="button" class="btn" onclick={() => (showCreateModal = false)}>
							Annuler
						</button>
						<button type="submit" class="btn btn-primary" disabled={loading}>
							{#if loading}
								<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								Création...
							{:else}
								<Plus class="w-4 h-4 mr-2" />
								Créer
							{/if}
						</button>
					</div>
				</form>
			</div>
			<div class="modal-backdrop" onclick={() => (showCreateModal = false)}></div>
		</dialog>
	{/if}

	<dialog id="deleteModal" class="modal">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Suppression de l'invitation</h3>
			<p class="pt-4">Voulez-vous réellement supprimer cette invitation
				({invitations.find(invitation => invitation.id === invitationDeleteId)?.code ?? ''}) ?</p>
			<p class="pb-4 font-bold">Cette action est irréversible!</p>
			<div class="modal-action">
				<form method="dialog">
					<button class="btn">Annuler</button>
				</form>
				<form action="?/inviteDelete" method="POST" use:enhance>
					<input type="hidden" name="inviteId" value="{invitationDeleteId}" />
					<button type="submit" class="btn btn-error"
									onclick={() => document.getElementById('deleteModal')?.close()}>Supprimer
					</button>
				</form>
			</div>
		</div>
	</dialog>

	<dialog class="modal {showUsagesModal ? 'modal-open' : ''}">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				Utilisations du code {selectedInvitation ? selectedInvitation.code : ""}
			</h3>

			<div class="space-y-2">
				{#if selectedInvitation && selectedInvitation.usedBy.length > 0}
					{#each selectedInvitation.usedBy as usage }
						<div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
							<div class="flex items-center gap-3">
								<Avatar size="w-8 h-8"
												avatarUrl={usage.user.profileImage ? `http://localhost/${usage.user.profileImage}` : null}
												fallbackName={usage.user.username} />
								<div>
									<p class="font-medium">{usage.user.username}</p>
									<p class="text-sm text-base-content/70">
										<Clock class="w-3 h-3 inline-block mr-1" />
										{formatDateToLocal(usage.usedAt)}
									</p>
								</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="text-center py-6 text-base-content/70">
						Aucune utilisation pour le moment
					</div>
				{/if}

				<div class="bg-base-200 p-4 rounded-lg mt-4">
					<div class="flex justify-between items-center">
						<span>Total des utilisations</span>
						<span class="font-bold">
            {selectedInvitation ? selectedInvitation.usedBy.length || 0 : 0}
							/ {selectedInvitation ? selectedInvitation.maxUses : 0}
          </span>
					</div>
					<progress
						class="progress progress-primary w-full mt-2"
						value={selectedInvitation ? selectedInvitation.usedBy.length || 0 : 0}
						max={selectedInvitation ? selectedInvitation.maxUses : 1}
					></progress>
				</div>
			</div>

			<div class="modal-action">
				<button class="btn" onclick={() => showUsagesModal = false}>
					Fermer
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => showUsagesModal = false}></div>
	</dialog>
</div>
