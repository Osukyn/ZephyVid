<script lang="ts">
	import 'tailwindcss/tailwind.css';
	import logo from '$lib/assets/logo.svg';
	import Avatar from '$lib/components/Avatar.svelte';
	import { formatProfileImage } from '$lib/utils/Avatar';
	export let data;

	$: data.user = data.user || null;
</script>

<div class="relative flex min-h-dvh flex-col overflow-hidden">
	{#if data.user}
	<header>
		<div class="navbar border-b-[1px] border-stone-900 px-4 md:px-12 shadow-2xl">
			<div class="dropdown h-full">
				<div tabindex="0" role="button" class="btn btn-ghost lg:hidden h-full">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h8m-8 6h16" />
					</svg>
				</div>
				<ul
					tabindex="0"
					class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
					<li>
						<a
							href="/videos"
							class="text-sm font-medium transition-colors hover:text-primary"
						>
							Mes Vidéos
						</a>
					</li>
					{#if data.user.isAdmin}
						<li>
							<a
								href="/invites"
								class="text-sm font-medium transition-colors hover:text-primary"
							>
								Invitations
							</a>
						</li>
					{/if}
				</ul>
			</div>
			<div class="flex-1">
				<a class="btn btn-ghost text-xl !pl-0" href="/videos">
					<img src={logo} alt="logo" class="h-10 w-12" />
					ZephyVid
				</a>
				<div class="hidden lg:flex h-full">
					<ul class="menu menu-horizontal mt-0 py-0 px-1 h-full">
						<li>
							<a
								href="/videos"
								class="btn btn-ghost h-full"
							>
								Mes Vidéos
							</a>
						</li>
						{#if data.user.isAdmin}
							<li>
								<a
									href="/invites"
									class="btn btn-ghost h-full"
								>
									Invitations
								</a>
							</li>
						{/if}
					</ul>
				</div>
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
						<Avatar
							avatarUrl={formatProfileImage(data.user.profileImage)}
							fallbackName={data.user.username}
							size="h-10 w-10"
							></Avatar>
					</div>
					<ul
						tabindex="0"
						class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
						<li>
							<a class="justify-between">
								Profile
							</a>
						</li>
						<li><a href="/settings">Paramètres</a></li>
						<li>
							<form class="flex grow" action="/api/logout" method="post">
								<button class="w-full text-left" type="submit">Déconnexion</button>
							</form>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</header>
	{/if}
	<main
		class="flex flex-col{ data.user ? ' h-[calc(100dvh-4.2rem)]' : ' h-dvh'}">
		<slot />
	</main>
</div>
