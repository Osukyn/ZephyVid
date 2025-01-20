<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatProfileImage } from '$lib/utils/Avatar.js';
	import { formatTimeAgoIntl } from '$lib/utils/Date.js';
	import { onDestroy, onMount } from 'svelte';
	import type { User } from '$lib/server/db/schema';

	let { comment, user, videoOwner }: {
		comment: any,
		user: {
			id: string,
			username: string,
			profileImage: string | null,
		},
		videoOwner: User
	} = $props();
	let updatedFormatDate = $state('');
	let updatedFormatDateInterval: number | null = setInterval(() => {
		if (typeof navigator !== 'undefined') updatedFormatDate = formatTimeAgoIntl(comment.createdAt);
	}, 10000) as unknown as number;

	let commentContainer: HTMLDivElement | null = $state(null);
	let isTruncated = $state(false);
	let showFull = $state(false);
	let editing = $state(false);
	let editingCommentContent = $state(comment.content);

	onMount(() => {
		updatedFormatDate = formatTimeAgoIntl(comment.createdAt);
		if (commentContainer) {
			const realHeight = commentContainer.scrollHeight;
			const visibleHeight = commentContainer.clientHeight;
			isTruncated = realHeight > visibleHeight;
		}
	});

	onDestroy(() => {
		if (updatedFormatDateInterval) clearInterval(updatedFormatDateInterval);
	});

	function toggleShowFull() {
		showFull = !showFull;
	}

	function handleEdit() {
		editing = true;
		setTimeout(() => {
			const textarea = document.getElementById(`edit-comment-${comment.id}`) as HTMLTextAreaElement;

			textarea.style.height = 'auto';
			textarea.style.height = textarea.scrollHeight + 'px';
			textarea.focus();
		});
	}

	function cancelEdit() {
		editing = false;
	}

	function handleInput(event: InputEvent) {
		const scrollPosition = window.scrollY;
		(event.target as HTMLTextAreaElement).style.height = 'auto';
		(event.target as HTMLTextAreaElement).style.height = (event.target as HTMLTextAreaElement).scrollHeight + 'px';
		window.scrollTo(0, scrollPosition);
	}
</script>

<div class="flex gap-4 w-full">
	<Avatar avatarUrl={formatProfileImage(comment.profileImage)} fallbackName={comment.username} size="10"
					ring={videoOwner && videoOwner.id === comment.userId} />
	<div class="w-full">
		<div class="flex gap-2 mb-2">
			<h3 class="align-text-top leading-none font-bold">{comment.username}</h3>
			<p class="text-xs text-base-content opacity-70">{updatedFormatDate}{(comment.updatedAt - comment.createdAt) > 0 ? ' (modifié)' : ''}</p>
		</div>
		{#if editing}
			<form action="?/editComment" method="POST" use:enhance>
				<input type="hidden" name="commentId" value="{comment.id}" />
				<textarea name="edit-comment-content"
									id="edit-comment-{comment.id}"
									bind:value={editingCommentContent}
									rows="1"
									class="textarea textarea-bordered w-full resize-none box-border overflow-hidden"
									placeholder="Ajoutez un commentaire..." maxlength="8192"
									oninput={handleInput}></textarea>
				<div class="flex gap-2 w-full justify-end">
					<button class="btn btn-sm btn-ghost" onclick={cancelEdit}>Annuler</button>
					<button class="btn btn-sm btn-primary" type="submit" onclick={() => setTimeout(() => editing = false)}>Enregistrer</button>
				</div>
			</form>
		{:else}
			<p class="{showFull ? '' : 'line-clamp-5'} overflow-hidden" contenteditable="false"
				 bind:innerText={comment.content} bind:this={commentContainer}></p>
		{/if}

		{#if isTruncated && !editing}
			<button
				class="btn btn-sm btn-ghost"
				onclick={toggleShowFull}
			>
				{#if showFull}Afficher moins{/if}
				{#if !showFull}Afficher plus{/if}
			</button>
		{/if}
	</div>
	{#if user && user.id === comment.userId}
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
			<ul id="controls-dropdown-{comment.id}" tabindex="0"
					class="dropdown-content menu bg-base-300 rounded-box z-[1] w-40 p-2 shadow ">
				<li>
					<button class="btn btn-ghost btn-sm !justify-start" onclick={() => handleEdit()}>
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
									onclick={() => document.getElementById(`deleteModal-${comment.id}`)?.showModal()}>
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

<dialog id="deleteModal-{comment.id}" class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Suppression du commentaire</h3>
		<p class="pt-4">Voulez-vous réellement supprimer ce commentaire ?</p>
		<p class="pb-4 font-bold">Cette action est irréversible!</p>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn">Annuler</button>
			</form>
			<form action="?/deleteComment" method="POST" use:enhance>
				<input type="hidden" name="commentId" value="{comment.id}" />
				<button type="submit" class="btn btn-error"
								onclick={() => document.getElementById(`deleteModal-${comment.id}`)?.close()}>Supprimer
				</button>
			</form>
		</div>
	</div>
</dialog>
