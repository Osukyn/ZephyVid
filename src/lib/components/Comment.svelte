<script lang="ts">
	import { enhance } from '$app/forms';

	let { comment, user } = $props();
	console.log(comment);
	console.log(user);
</script>

{#if user && user.id === comment.user.id}
	<div class="flex items-center gap-4">
		<div class="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center">
			<span>{comment.user.username.toUpperCase()}</span>
		</div>
		<p>{comment.comments.content}</p>
	</div>
	<form action="?/deleteComment" method="POST" use:enhance>
		<input type="hidden" name="commentId" value="{comment.comments.id}" />
		<button type="submit" class="btn btn-error">Supprimer</button>
	</form>
{:else}
	<div class="flex items-center gap-4">
		<div class="bg-neutral text-neutral-content w-10 h-10 rounded-full flex items-center justify-center">
			<span>{comment.user.username.toUpperCase()}</span>
		</div>
		<p>{comment.comments.content}</p>
	</div>
{/if}
