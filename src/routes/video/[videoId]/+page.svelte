<script lang="ts">
	import Player from '$lib/components/Player.svelte';
	import { formatDateToLocal, formatTimeAgoIntl } from '$lib/utils/Date';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import Comment from '$lib/components/Comment.svelte';
	import { formatNumber } from '$lib/utils/Number';
	import Avatar from '$lib/components/Avatar.svelte';
	import { flip } from 'svelte/animate';
	import { formatProfileImage } from '$lib/utils/Avatar';
	import { Download, Pen } from 'lucide-svelte';

	let { data } = $props();

	let displayDate = $state('');
	let viewCount = $state(`${data.videoData.viewCount}`);
	let newComment = $state('');
	let collapsed = $state(true);
	let like = $state(data.likeData.userLike);
	let likeData = $state(data.likeData);
	let formatedLikeData = $state({
		likes: '',
		dislikes: ''
	});
	let sort = $state('recent');
	let comments = $state(data.comments);
	let sortedComments = $derived.by(() => {
		for (const c of comments) {
			c.likes;
			c.dislikes;
		}
		return sortComments(sort, comments);
	});
	let commentCount = $derived.by(() => {
		let count = comments.length;
		for (const c of comments) {
			count += c.responses.length;
		}
		return count;
	});

	onMount(() => {
		$effect(() => {
			if (collapsed) {
				viewCount = formatNumber(data.videoData.viewCount);
				displayDate = `${formatTimeAgoIntl(data.videoData.createdAt)}`;
			} else {
				viewCount = `${data.videoData.viewCount}`;
				displayDate = `le ${formatDateToLocal(data.videoData.createdAt)}`;
			}
			formatedLikeData = {
				likes: formatNumber(likeData.likes),
				dislikes: formatNumber(likeData.dislikes)
			};
			comments = data.comments;
		});

		window.addEventListener('resize', () => {
			const scrollPosition = window.scrollY;
			const textarea = document.getElementById('new_comment');
			if (textarea) {
				textarea.style.height = 'auto';
				textarea.style.height = textarea.scrollHeight + 'px';
			}
			const descElement = document.getElementById('desc');
			if (descElement && !collapsed) {
				descElement.style.height = 'auto';
				descElement.style.height = descElement.scrollHeight + 'px';
			}
			window.scrollTo(0, scrollPosition);
		});

		document.getElementById('desc-container')?.addEventListener('click', () => {
			if (collapsed) collapse(false);
		});
	});

	let source = data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/');

	function handleInput(event: InputEvent) {
		const scrollPosition = window.scrollY;
		(event.target as HTMLTextAreaElement).style.height = 'auto';
		(event.target as HTMLTextAreaElement).style.height = (event.target as HTMLTextAreaElement).scrollHeight + 'px';
		window.scrollTo(0, scrollPosition);
	}

	function onreset() {
		const textarea = document.getElementById('new_comment');
		const scrollPosition = window.scrollY;
		if (!textarea) return;
		textarea.style.height = 'auto';
		window.scrollTo(0, scrollPosition);
	}

	function collapse(target: boolean) {
		const descElement = document.getElementById('desc');
		collapsed = target;
		if (!descElement) return;
		setTimeout(() => {
			if (target) {
				descElement.style.height = '6.75rem';
				setTimeout(() => descElement.style.maxHeight = '6.75rem', 350);
			} else {
				descElement.style.maxHeight = '100%';
				descElement.style.height = descElement.scrollHeight + 'px';
			}
		});
	}

	async function handleLike(targetLike: number) {
		const previousLike = like;
		if (like === targetLike) {
			like = 0;
		} else {
			like = targetLike;
		}

		const result = await fetch(`/api/video/like`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ videoId: data.videoId, like })
		});

		if (!result.ok) {
			like = previousLike;
		}

		likeData = await result.json();
	}

	let description = $state(data.videoData.description === '' ? 'Aucune description n\'a été ajoutée à cette vidéo.' : data.videoData.description);

	function sortComments(sortMode: string, array: Array<any>) {
		let sorted = [...array];
		if (sortMode === 'popular') {
			sorted.sort((a, b) => {
				const scoreA = a.likes - a.dislikes;
				const scoreB = b.likes - b.dislikes;
				if (scoreB !== scoreA) {
					return scoreB - scoreA;
				}
				return b.createdAt - a.createdAt;
			});
		} else if (sortMode === 'recent') {
			sorted.sort((a, b) => b.createdAt - a.createdAt);
		}
		return sorted;
	}

	function handleSortClick(sortMode: string) {
		sort = sortMode;
		const dropdown = document.getElementById('sort-dropdown');
		if (dropdown) {
			dropdown.removeAttribute('tabIndex');
			dropdown.setAttribute('tabIndex', '0');
		}
	}
</script>

<div class="overflow-auto h-full pb-4">
	<Player src={source} status={data.videoData.status} title={data.videoData.title}
					poster="http://localhost/{data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/')}/transcoded/full_thumbnail_001.jpg"
					id={data.videoId} />

	<div class="flex justify-center">
		<div class="flex flex-col gap-4 mt-2 px-4 md:px-12 w-full max-w-screen-lg">
			<div class="w-full">
				<h1 class="text-xl font-bold mb-2">{data.videoData.title}</h1>
				<div class="flex items-center justify-between gap-4 mb-2">
					<a href="/user/{data.ownerData.username}" class="flex items-center gap-2">
						<Avatar avatarUrl={data.ownerData.profileImage} fallbackName={data.ownerData.username} size="h-10 w-10" />
						<span class="font-bold">{data.ownerData.username}</span>
					</a>
					<div class="flex items-center">
						<div class="join rounded-full">
							<button class="custom-radio btn join-item" aria-label="like" onclick={() => handleLike(1)}>
								{#if (like === 0 || like === -1)}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
										<path
											d="M14.5998 8.00033H21C22.1046 8.00033 23 8.89576 23 10.0003V12.1047C23 12.3659 22.9488 12.6246 22.8494 12.8662L19.755 20.3811C19.6007 20.7558 19.2355 21.0003 18.8303 21.0003H2C1.44772 21.0003 1 20.5526 1 20.0003V10.0003C1 9.44804 1.44772 9.00033 2 9.00033H5.48184C5.80677 9.00033 6.11143 8.84246 6.29881 8.57701L11.7522 0.851355C11.8947 0.649486 12.1633 0.581978 12.3843 0.692483L14.1984 1.59951C15.25 2.12534 15.7931 3.31292 15.5031 4.45235L14.5998 8.00033ZM7 10.5878V19.0003H18.1606L21 12.1047V10.0003H14.5998C13.2951 10.0003 12.3398 8.77128 12.6616 7.50691L13.5649 3.95894C13.6229 3.73105 13.5143 3.49353 13.3039 3.38837L12.6428 3.0578L7.93275 9.73038C7.68285 10.0844 7.36341 10.3746 7 10.5878ZM5 11.0003H3V19.0003H5V11.0003Z"></path>
									</svg>
								{:else if like === 1}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
										<path
											d="M2 8.99997H5V21H2C1.44772 21 1 20.5523 1 20V9.99997C1 9.44769 1.44772 8.99997 2 8.99997ZM7.29289 7.70708L13.6934 1.30661C13.8693 1.13066 14.1479 1.11087 14.3469 1.26016L15.1995 1.8996C15.6842 2.26312 15.9026 2.88253 15.7531 3.46966L14.5998 7.99997H21C22.1046 7.99997 23 8.8954 23 9.99997V12.1043C23 12.3656 22.9488 12.6243 22.8494 12.8658L19.755 20.3807C19.6007 20.7554 19.2355 21 18.8303 21H8C7.44772 21 7 20.5523 7 20V8.41419C7 8.14897 7.10536 7.89462 7.29289 7.70708Z"></path>
									</svg>
								{/if}
								{formatedLikeData.likes}
							</button>
							<button class="custom-radio btn join-item" aria-label="dislike" onclick={() => handleLike(-1)}>
								{formatedLikeData.dislikes}
								{#if (like === 0 || like === 1)}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
										<path
											d="M9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15H18.5182C18.1932 15 17.8886 15.1579 17.7012 15.4233L12.2478 23.149C12.1053 23.3508 11.8367 23.4184 11.6157 23.3078L9.80163 22.4008C8.74998 21.875 8.20687 20.6874 8.49694 19.548L9.40017 16ZM17 13.4125V5H5.83939L3 11.8957V14H9.40017C10.7049 14 11.6602 15.229 11.3384 16.4934L10.4351 20.0414C10.3771 20.2693 10.4857 20.5068 10.6961 20.612L11.3572 20.9425L16.0673 14.27C16.3172 13.9159 16.6366 13.6257 17 13.4125ZM19 13H21V5H19V13Z"></path>
									</svg>
								{:else if like === -1}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
										<path
											d="M22 15H19V3H22C22.5523 3 23 3.44772 23 4V14C23 14.5523 22.5523 15 22 15ZM16.7071 16.2929L10.3066 22.6934C10.1307 22.8693 9.85214 22.8891 9.65308 22.7398L8.8005 22.1004C8.3158 21.7369 8.09739 21.1174 8.24686 20.5303L9.40017 16H3C1.89543 16 1 15.1046 1 14V11.8957C1 11.6344 1.05118 11.3757 1.15064 11.1342L4.24501 3.61925C4.3993 3.24455 4.76447 3 5.16969 3H16C16.5523 3 17 3.44772 17 4V15.5858C17 15.851 16.8946 16.1054 16.7071 16.2929Z"></path>
									</svg>
								{/if}
							</button>
						</div>
						{#if data.user.id === data.ownerData.id}
							<a class="btn rounded-full" href="/video/{data.videoId}/edit" aria-label="Edit button">
								<Pen />
								Editer
							</a>
						{/if}
						{#if data.videoData.allowDownloads}
							<a class="btn rounded-full" href="http://localhost/{data.videoData.sourceFilePath}" target="_blank" aria-label="Download button">
								<Download />
								Télécharger
							</a>
						{/if}
					</div>
				</div>
				<div id="desc-container" class="card bg-base-200 { collapsed ? 'cursor-pointer' : '' }">
					<div id="desc" class="card-body !p-4 overflow-hidden">
						<h2 class="text-sm font-bold">{viewCount} vues {displayDate}</h2>
						<p
							class="text-sm {data.videoData.description && data.videoData.description.length > 0 ? '' : 'text-gray-500'}"
							contenteditable="false"
							bind:innerText={description}></p>
						{#if !collapsed}
							<div class="card-actions justify-start">
								<button class="btn btn-sm" onclick={() => collapse(true)}>Moins</button>
							</div>
						{:else}
							<div in:fade={{duration: 400}} class="absolute flex right-2 bottom-1">
								<div class="w-10 h-5 bg-gradient-to-r from-transparent to-base-200"></div>
								<div class="bg-base-200 text-sm text-nowrap">
									...afficher plus
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div>
				<div class="flex items-center gap-4">
					<h2 class="text-xl font-bold">Commentaires <span
						class="text-stone-400"><strong>·</strong> {commentCount}</span>
					</h2>
					<div class="dropdown">
						<div tabindex="0" role="button" class="btn btn-ghost">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
									 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
									 class="lucide lucide-list-filter">
								<path d="M3 6h18" />
								<path d="M7 12h10" />
								<path d="M10 18h4" />
							</svg>
							Trier par
						</div>
						<ul id="sort-dropdown" tabindex="0"
								class="dropdown-content menu bg-base-300 rounded-box z-[1] w-40 p-2 shadow ">
							<li>
								<a class="btn {sort === 'popular' ? 'btn-primary' : 'btn-ghost'} btn-sm !justify-start"
									 onclick={() => handleSortClick('popular')}>
									Popularité
								</a>
							</li>
							<li>
								<a class="btn {sort === 'recent' ? 'btn-primary' : 'btn-ghost'} btn-sm !justify-start"
									 onclick={() => handleSortClick('recent')}>
									Les plus récents
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div class="mt-4">
					<form class="mb-4" action="?/comment" method="POST" use:enhance onreset={onreset}>
						<div class="flex flex-col">
							<div class="flex items-start gap-4">
								<Avatar avatarUrl={formatProfileImage(data.user.profileImage)} fallbackName={data.user.username}
												size="h-10 w-10" />
								<input name="parent" type="text" class="hidden">
								<textarea name="comment"
													id="new_comment"
													bind:value={newComment}
													rows="1"
													class="textarea textarea-bordered w-full resize-none box-border overflow-hidden"
													placeholder="Ajoutez un commentaire..." maxlength="8192"
													oninput={handleInput}></textarea>
							</div>
							<div transition:fade={{duration: 100}} class="flex justify-end gap-2 mt-2">
								<button class="btn btn-ghost btn-sm" type="reset" disabled={newComment.length < 1}>Annuler</button>
								<button class="btn btn-primary btn-sm" type="submit" disabled={newComment.length < 1}>Commenter</button>
							</div>
						</div>
					</form>
					{#if comments.length === 0}
						<p class="text-sm text-gray-500 text-center">Aucun commentaire pour le moment</p>
					{:else}
						<div class="flex flex-col gap-4 w-full">
							{#each sortedComments as comment, i (comment.id)}
								<div id={comment.id} transition:fade={{duration: 100}} animate:flip={{duration: 100}}>
									<Comment bind:comment={sortedComments[i]} videoOwner={data.ownerData} user={data.user} />
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="css">
    #desc {
        height: 6.75rem;
        max-height: 6.75rem;
        transition: height 0.3s ease;
    }
</style>
