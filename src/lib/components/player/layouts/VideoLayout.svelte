<script lang="ts">
	import CaptionButton from '../buttons/CaptionButton.svelte';
	import FullscreenButton from '../buttons/FullscreenButton.svelte';
	import MuteButton from '../buttons/MuteButton.svelte';
	import PlayButton from '../buttons/PlayButton.svelte';
	import Captions from '../Captions.svelte';
	import ChapterTitle from '../ChapterTitle.svelte';
	import Gestures from '../Gestures.svelte';
	import SettingsMenu from '../menus/SettingsMenu.svelte';
	import TimeSlider from '../sliders/TimeSlider.svelte';
	import VolumeSlider from '../sliders/VolumeSlider.svelte';
	import TimeGroup from '../TimeGroup.svelte';

	export let thumbnails: string | undefined = undefined;
</script>

<Gestures />
<Captions />

<div
	class="pointer-events-none absolute inset-0 z-50 flex h-full w-full items-center justify-center"
>
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
			 stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle w-32 h-32 opacity-0 transition-opacity duration-200 ease-linear media-buffering:animate-spin media-buffering:opacity-100 [&>[data-part='track']]:opacity-25">
		<path d="M21 12a9 9 0 1 1-6.219-8.56" />
	</svg>
</div>

<media-controls
	class="media-controls:opacity-100 absolute inset-0 z-10 flex h-full w-full flex-col opacity-0 transition-opacity"
>
	<div class="flex-1"></div>
	<media-controls-group class="flex w-full items-center px-2">
		<TimeSlider {thumbnails} />
	</media-controls-group>
	<media-controls-group
		class="-mt-0.5 flex w-full items-center px-2 pb-2 bg-gradient-to-t from-black/80 to-transparent">
		<PlayButton tooltipPlacement="top start" />
		<MuteButton tooltipPlacement="top" />
		<VolumeSlider />
		<TimeGroup />
		<ChapterTitle />
		<div class="flex-1"></div>
		<CaptionButton tooltipPlacement="top" />
		<SettingsMenu placement="top end" tooltipPlacement="top" />
		<FullscreenButton tooltipPlacement="top end" />
	</media-controls-group>
</media-controls>

<style scoped>
    media-controls {
        /* These CSS variables are supported out of the box to easily apply offsets to all tooltips/menus.  */
        --media-tooltip-y-offset: 30px;
        --media-menu-y-offset: 30px;
    }

    media-controls :global(media-volume-slider) {
        --media-slider-preview-offset: 30px;
    }
</style>
