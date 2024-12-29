<media-slider-chapters class="relative flex h-full w-full items-center rounded-[1px]">
  <template>
    <!-- Chapter -->
    <div
      class="last-child:mr-0 relative mr-0.5 flex h-full w-full items-center rounded-[1px]"
      style="contain: layout style"
    >
      <!-- Track -->
      <div
        class="relative z-0 h-[5px] w-full rounded-sm bg-white/30 ring-sky-400 group-data-[focus]:ring-[3px]"
      >
        <!-- Track Fill -->
        <div
          class="absolute z-20 h-full w-[var(--chapter-fill)] rounded-sm bg-primary will-change-[width]"
        ></div>
        <!-- Progress -->
        <div
          class="absolute z-10 h-full w-[var(--chapter-progress)] rounded-sm bg-white/30 will-change-[width]"
        ></div>
      </div>
    </div>
  </template>
</media-slider-chapters>
