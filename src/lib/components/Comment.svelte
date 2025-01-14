<script lang="ts">
	import { enhance } from '$app/forms';
	import type { User } from '$lib/server/db/schema';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatProfileImage } from '$lib/utils/Avatar.js';

	let { comment, user }: {comment: any, user: User} = $props();
	console.log(comment);
	console.log(user);
</script>

{#if user && user.id === comment.user.id}
	<div class="flex items-center gap-4">
		<Avatar avatarUrl={formatProfileImage(comment.user.profileImage)} fallbackName={comment.user.username} size="10" fallbackColor="primary" />
		<p>{comment.comments.content}</p>
	</div>
	<form action="?/deleteComment" method="POST" use:enhance>
		<input type="hidden" name="commentId" value="{comment.comments.id}" />
		<button type="submit" class="btn btn-error">Supprimer</button>
	</form>
{:else}
	<div class="flex items-center gap-4">
		<Avatar avatarUrl={formatProfileImage(comment.user.profileImage)} fallbackName={comment.user.username} size="10" />
		<p>{comment.comments.content}</p>
	</div>
{/if}
