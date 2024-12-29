<script lang="ts">
	import 'tailwindcss/tailwind.css';
	import { page } from '$app/state';
	export let data;

	$: data.user = data.user || null;
</script>

<div class="relative flex min-h-dvh flex-col overflow-hidden">
	{#if data.user}
	<header>
		<div class="navbar border-b-[1px] border-stone-900 px-12 shadow-2xl">
			<div class="flex-1">
				<a class="btn btn-ghost text-xl !px-0" href="/videos">ZephyVid</a>
			</div>
			<div class="flex-none gap-2">
				<a class="btn btn-ghost btn-square" href="/videos/upload" aria-label="upload video button">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
							 stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"
							 class="lucide lucide-upload">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" x2="12" y1="3" y2="15" />
					</svg>
				</a>
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder">
							<div class="bg-neutral text-neutral-content w-10 rounded-full">
								<span class="text-3xl">{data.user.username[0].toUpperCase()}</span>
							</div>
					</div>
					<ul
						tabindex="0"
						class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
						<li>
							<a class="justify-between">
								Profile
							</a>
						</li>
						<li><a>Paramètres</a></li>
						<li>
							<form action="/api/logout" method="post">
								<button type="submit">Déconnexion</button>
							</form>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</header>
	{/if}
	<main
		class="flex flex-col px-12 py-4 { page.url.pathname.split('/').length === 3 && page.url.pathname.split('/').at(1) === 'video'  ?  '!py-0' : '' } h-[calc(100dvh-4.2rem)]">
		<slot />
	</main>
</div>
