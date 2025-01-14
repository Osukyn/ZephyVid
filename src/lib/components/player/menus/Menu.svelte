<script lang="ts">
  import type { MenuPlacement, TooltipPlacement } from 'vidstack';

  import Tooltip from '../Tooltip.svelte';

  export let placement: MenuPlacement;
  export let tooltipPlacement: TooltipPlacement;
</script>

<media-menu>
	<media-menu-button
		class="group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset ring-sky-400 hover:bg-white/20 data-[focus]:ring-4"
		aria-label="Paramètres"
	>
		<media-icon
			type="settings"
			class="h-8 w-8 transform transition-transform duration-200 ease-out group-data-[open]:rotate-90"
		></media-icon>
	</media-menu-button>
	<media-menu-items
		class="flex h-[var(--menu-height)] max-h-[400px] min-w-[260px] flex-col overflow-y-auto overscroll-y-contain rounded-md border border-white/10 bg-black/95 p-2.5 font-sans text-[15px] font-medium outline-none backdrop-blur-sm transition-[height] duration-300 will-change-[height] animate-out fade-out slide-out-to-bottom-2 data-[resizing]:overflow-hidden data-[open]:animate-in data-[open]:fade-in data-[open]:slide-in-from-bottom-4"
		placement="top"
		offset="0"
	>
		<media-menu>
			<!-- Button -->
			<media-menu-button
				class="parent left-0 z-10 flex w-full cursor-pointer select-none items-center justify-start rounded-sm bg-black/60 p-2.5 outline-none ring-inset ring-sky-400 aria-disabled:hidden data-[open]:sticky data-[open]:-top-2.5 data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"
			>
				<media-icon
					type="chevron-left"
					class="parent-data-[open]:block -ml-0.5 mr-1.5 hidden h-[18px] w-[18px]"
				></media-icon>
				<media-icon type="settings-menu" class="parent-data-[open]:hidden h-5 w-5"></media-icon>
				<span class="parent-data-[open]:ml-0 ml-1.5">Quality</span>
				<span class="ml-auto text-sm text-white/50" data-part="hint"></span>
				<media-icon
					type="chevron-right"
					class="parent-data-[open]:hidden ml-0.5 h-[18px] w-[18px] text-sm text-white/50"
				></media-icon>
			</media-menu-button>
			<!-- Items -->
			<media-menu-items
				class="hidden w-full flex-col items-start justify-center outline-none data-[keyboard]:mt-[3px] data-[open]:inline-block"
			>
				<media-quality-radio-group class="flex w-full flex-col" auto-label="Auto">
					<template>
						<media-radio
							class="group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 outline-none ring-sky-400 data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"
						>
							<media-icon
								type="radio"
								class="h-4 w-4 text-white group-data-[checked]:hidden"
							></media-icon>
							<media-icon
								type="radio-selected"
								class="hidden h-4 w-4 text-indigo-400 group-data-[checked]:block"
							></media-icon>
							<span class="ml-2" data-part="label"></span>
							<span class="ml-auto text-[13px] text-gray-300" data-part="bitrate"></span>
						</media-radio>
					</template>
				</media-quality-radio-group>
			</media-menu-items>
		</media-menu>

		<media-menu>
			<!-- Button -->
			<media-menu-button
				class="parent left-0 z-10 flex w-full cursor-pointer select-none items-center justify-start rounded-sm bg-black/60 p-2.5 outline-none ring-inset ring-sky-400 aria-disabled:hidden data-[open]:sticky data-[open]:-top-2.5 data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"
			>
				<media-icon
					type="chevron-left"
					class="parent-data-[open]:block -ml-0.5 mr-1.5 hidden h-[18px] w-[18px]"
				></media-icon>
				<media-icon type="odometer" class="parent-data-[open]:hidden h-5 w-5"></media-icon>
				<span class="parent-data-[open]:ml-0 ml-1.5">Speed</span>
				<span class="ml-auto text-sm text-white/50" data-part="hint"></span>
				<media-icon
					type="chevron-right"
					class="parent-data-[open]:hidden ml-0.5 h-[18px] w-[18px] text-sm text-white/50"
				></media-icon>
			</media-menu-button>
			<!-- Items -->
			<media-menu-items
				class="hidden w-full flex-col items-start justify-center outline-none data-[keyboard]:mt-[3px] data-[open]:inline-block"
			>
				<media-speed-radio-group class="flex w-full flex-col" normal-label="Normal">
					<template>
						<media-radio
							class="group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 outline-none ring-sky-400 data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"
						>
							<media-icon
								type="radio"
								class="h-4 w-4 text-white group-data-[checked]:hidden"
							></media-icon>
							<media-icon
								type="radio-selected"
								class="hidden h-4 w-4 text-indigo-400 group-data-[checked]:block"
							></media-icon>
							<span class="ml-2" data-part="label"></span>
						</media-radio>
					</template>
				</media-speed-radio-group>
			</media-menu-items>
		</media-menu>

		<media-menu>
			<!-- Button -->
			<media-menu-button
				class="parent left-0 z-10 flex w-full cursor-pointer select-none items-center justify-start rounded-sm bg-black/60 p-2.5 outline-none ring-inset ring-sky-400 aria-disabled:hidden data-[open]:sticky data-[open]:-top-2.5 data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"
			>
				<media-icon
					type="chevron-left"
					class="parent-data-[open]:block -ml-0.5 mr-1.5 hidden h-[18px] w-[18px]"
				></media-icon>
				<media-icon type="closed-captions" class="parent-data-[open]:hidden h-5 w-5"></media-icon>
				<span class="parent-data-[open]:ml-0 ml-1.5">Captions</span>
				<span class="ml-auto text-sm text-white/50" data-part="hint"></span>
				<media-icon
					type="chevron-right"
					class="parent-data-[open]:hidden ml-0.5 h-[18px] w-[18px] text-sm text-white/50"
				></media-icon>
			</media-menu-button>
			<!-- Items -->
			<media-menu-items
				class="hidden w-full flex-col items-start justify-center outline-none data-[keyboard]:mt-[3px] data-[open]:inline-block"
			>
				<media-captions-radio-group class="flex w-full flex-col" off-label="Off">
					<template>
						<media-radio
							class="group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 outline-none ring-sky-400 data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"
						>
							<media-icon
								type="radio"
								class="h-4 w-4 text-white group-data-[checked]:hidden"
							></media-icon>
							<media-icon
								type="radio-selected"
								class="hidden h-4 w-4 text-indigo-400 group-data-[checked]:block"
							></media-icon>
							<span class="ml-2" data-part="label"></span>
						</media-radio>
					</template>
				</media-captions-radio-group>
			</media-menu-items>
		</media-menu>
	</media-menu-items>
</media-menu>

<!--<media-menu>
   -- Menu Button
  <Tooltip placement={tooltipPlacement}>
    <media-menu-button
      class="group ring-media-focus relative mr-0.5 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/20 data-[focus]:ring-4 aria-hidden:hidden"
      slot="trigger"
    >
      <slot name="button" />
    </media-menu-button>

    <slot name="tooltip-content" slot="content" />
  </Tooltip>
-- Menu Items
  <media-menu-items
    class="animate-out fade-out slide-out-to-bottom-2 data-[open]:animate-in data-[open]:fade-in data-[open]:slide-in-from-bottom-4 flex h-[var(--menu-height)] max-h-[400px] min-w-[260px] flex-col overflow-y-auto overscroll-y-contain rounded-md border border-white/10 bg-black/95 p-2.5 font-sans text-[15px] font-medium outline-none backdrop-blur-sm transition-[height] duration-300 will-change-[height] data-[resizing]:overflow-hidden"
    {placement}
  >
    <slot name="content" />
  </media-menu-items>
</media-menu>
-->
