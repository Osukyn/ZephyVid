<script lang="ts">
	import Player from '$lib/components/Player.svelte';

	export let data;
	let source = data.videoData.sourceFilePath?.split('/').slice(0, -1).join('/');
</script>

<Player src={source} status={data.videoData.status} title={data.videoData.title} />
