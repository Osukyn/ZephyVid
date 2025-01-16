<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatProfileImage } from '$lib/utils/Avatar.js';
	import { formatTimeAgoIntl } from '$lib/utils/Date.js';

	let { comment, user }: {
		comment: any,
		user: {
			id: string,
			username: string,
			profileImage: string | null,
		},
	} = $props();
	let formatDate = $derived(typeof navigator !== 'undefined' ? formatTimeAgoIntl(comment.comments.createdAt) : '');
</script>

<div class="flex gap-4 w-full">
	<Avatar avatarUrl={formatProfileImage(comment.user.profileImage)} fallbackName={comment.user.username} size="10"
					ring={user && user.id === comment.user.id} />
	<div class="w-full">
		<div class="flex gap-2">
			<h3 class="align-text-top leading-none font-bold">{comment.user.username}</h3>
			<p class="text-xs text-base-content opacity-70">{formatDate}</p>
		</div>
		<p>{comment.comments.content}</p>
	</div>
	{#if user && user.id === comment.user.id}
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
						 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
						 class="lucide lucide-ellipsis-vertical">
					<circle cx="12" cy="12" r="1" />
					<circle cx="12" cy="5" r="1" />
					<circle cx="12" cy="19" r="1" />
				</svg>
			</div>
			<ul tabindex="0" class="dropdown-content menu bg-base-300 rounded-box z-[1] w-40 p-2 shadow ">
				<li>
					<button class="btn btn-ghost btn-sm !justify-start">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
								 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
								 class="lucide lucide-pencil">
							<path
								d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
							<path d="m15 5 4 4" />
						</svg>
						Editer
					</button>
				</li>
				<li>
					<button class="btn btn-ghost btn-sm !justify-start"
									onclick={() => document.getElementById(`deleteModal-${comment.comments.id}`)?.showModal()}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
								 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
								 class="lucide lucide-trash-2">
							<path d="M3 6h18" />
							<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
							<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
							<line x1="10" x2="10" y1="11" y2="17" />
							<line x1="14" x2="14" y1="11" y2="17" />
						</svg>
						Supprimer
					</button>
				</li>
			</ul>
		</div>
	{/if}
</div>

<dialog id="deleteModal-{comment.comments.id}" class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Suppression du commentaire</h3>
		<p class="pt-4">Voulez-vous réellement supprimer ce commentaire ?</p>
		<p class="pb-4 font-bold">Cette action est irréversible!</p>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Annuler</button>
			</form>
			<form action="?/deleteComment" method="POST" use:enhance>
				<input type="hidden" name="commentId" value="{comment.comments.id}" />
				<button type="submit" class="btn btn-error" onclick={() => document.getElementById(`deleteModal-${comment.comments.id}`)?.close()}>Supprimer</button>
			</form>
		</div>
	</div>
</dialog>
