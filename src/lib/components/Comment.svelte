<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatProfileImage } from '$lib/utils/Avatar.js';
	import { formatTimeAgoIntl } from '$lib/utils/Date.js';
	import { onDestroy, onMount } from 'svelte';
	import type { User } from '$lib/server/db/schema';
	import { formatNumber } from '$lib/utils/Number';

	let {
		comment = $bindable(), user, videoOwner
	}: {
		comment: any,
		user: {
			id: string,
			username: string,
			profileImage: string | null,
		},
		videoOwner: User,
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
	let formatedLikeData = $state({
		likes: '',
		dislikes: ''
	});
	let like = $state(comment.userVote);

	onMount(() => {
		updatedFormatDate = formatTimeAgoIntl(comment.createdAt);
		if (commentContainer) {
			const realHeight = commentContainer.scrollHeight;
			const visibleHeight = commentContainer.clientHeight;
			isTruncated = realHeight > visibleHeight;
		}
		$effect(() => {
			formatedLikeData = {
				likes: formatNumber(comment.likes),
				dislikes: formatNumber(comment.dislikes)
			};
		});
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

	async function handleLike(targetLike: number) {
		const previousLike = like;
		if (like === targetLike) {
			like = 0;
		} else {
			like = targetLike;
		}

		const result = await fetch(`/api/comment/like`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ commentId: comment.id, like })
		});

		if (!result.ok) {
			comment.userVote = previousLike;
		} else {
			const updated = await result.json();
			comment.likes = updated.likes;
			comment.dislikes = updated.dislikes;
		}
	}
</script>

<div class="flex gap-4 w-full">
	<Avatar avatarUrl={formatProfileImage(comment.profileImage)} fallbackName={comment.username} size="10"
					ring={videoOwner && videoOwner.id === comment.userId} />
	<div class="flex flex-col w-full">
		<div class="flex gap-2 mb-2">
			<h3 class="align-text-top leading-none font-bold">{comment.username}</h3>
			<p
				class="text-xs text-base-content opacity-70">{updatedFormatDate}{(comment.updatedAt - comment.createdAt) > 0 ? ' (modifié)' : ''}</p>
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
					<button class="btn btn-sm btn-primary" type="submit" onclick={() => setTimeout(() => editing = false)}>
						Enregistrer
					</button>
				</div>
			</form>
		{:else}
			<p class="{showFull ? '' : 'line-clamp-5'} overflow-hidden" contenteditable="false"
				 bind:innerText={comment.content} bind:this={commentContainer}></p>
		{/if}

		{#if isTruncated && !editing}
			<button
				class="btn btn-sm btn-ghost w-fit"
				onclick={toggleShowFull}
			>
				{#if showFull}Afficher moins{/if}
				{#if !showFull}Afficher plus{/if}
			</button>
		{/if}
		<div class="join rounded-full">
			<button class="custom-radio btn join-item btn-sm btn-ghost" aria-label="like" onclick={() => handleLike(1)}>
				{#if (like === 0 || like === -1)}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path
							d="M14.5998 8.00033H21C22.1046 8.00033 23 8.89576 23 10.0003V12.1047C23 12.3659 22.9488 12.6246 22.8494 12.8662L19.755 20.3811C19.6007 20.7558 19.2355 21.0003 18.8303 21.0003H2C1.44772 21.0003 1 20.5526 1 20.0003V10.0003C1 9.44804 1.44772 9.00033 2 9.00033H5.48184C5.80677 9.00033 6.11143 8.84246 6.29881 8.57701L11.7522 0.851355C11.8947 0.649486 12.1633 0.581978 12.3843 0.692483L14.1984 1.59951C15.25 2.12534 15.7931 3.31292 15.5031 4.45235L14.5998 8.00033ZM7 10.5878V19.0003H18.1606L21 12.1047V10.0003H14.5998C13.2951 10.0003 12.3398 8.77128 12.6616 7.50691L13.5649 3.95894C13.6229 3.73105 13.5143 3.49353 13.3039 3.38837L12.6428 3.0578L7.93275 9.73038C7.68285 10.0844 7.36341 10.3746 7 10.5878ZM5 11.0003H3V19.0003H5V11.0003Z"></path>
					</svg>
				{:else if like === 1}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path
							d="M2 8.99997H5V21H2C1.44772 21 1 20.5523 1 20V9.99997C1 9.44769 1.44772 8.99997 2 8.99997ZM7.29289 7.70708L13.6934 1.30661C13.8693 1.13066 14.1479 1.11087 14.3469 1.26016L15.1995 1.8996C15.6842 2.26312 15.9026 2.88253 15.7531 3.46966L14.5998 7.99997H21C22.1046 7.99997 23 8.8954 23 9.99997V12.1043C23 12.3656 22.9488 12.6243 22.8494 12.8658L19.755 20.3807C19.6007 20.7554 19.2355 21 18.8303 21H8C7.44772 21 7 20.5523 7 20V8.41419C7 8.14897 7.10536 7.89462 7.29289 7.70708Z"></path>
					</svg>
				{/if}
				{formatedLikeData.likes}
			</button>
			<button class="custom-radio btn join-item btn-sm btn-ghost" aria-label="dislike" onclick={() => handleLike(-1)}>
				{formatedLikeData.dislikes}
				{#if (like === 0 || like === 1)}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path
							d="M9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15H18.5182C18.1932 15 17.8886 15.1579 17.7012 15.4233L12.2478 23.149C12.1053 23.3508 11.8367 23.4184 11.6157 23.3078L9.80163 22.4008C8.74998 21.875 8.20687 20.6874 8.49694 19.548L9.40017 16ZM17 13.4125V5H5.83939L3 11.8957V14H9.40017C10.7049 14 11.6602 15.229 11.3384 16.4934L10.4351 20.0414C10.3771 20.2693 10.4857 20.5068 10.6961 20.612L11.3572 20.9425L16.0673 14.27C16.3172 13.9159 16.6366 13.6257 17 13.4125ZM19 13H21V5H19V13Z"></path>
					</svg>
				{:else if like === -1}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path
							d="M22 15H19V3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15ZM16.7071 16.2929L10.3066 22.6934C10.1307 22.8693 9.85214 22.8891 9.65308 22.7398L8.8005 22.1004C8.3158 21.7369 8.09739 21.1174 8.24686 20.5303L9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H16C16.5523 3 17 3.44772 17 4V15.5858C17 15.851 16.8946 16.1054 16.7071 16.2929Z"></path>
					</svg>
				{/if}
			</button>
		</div>
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
