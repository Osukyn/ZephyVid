<script lang="ts">
	import { Lock, Upload, Users, BarChart3, ChevronRight, Shield, Eye, UserPlus } from "lucide-svelte";

	let email: string = "";
	let loading: boolean = false;

	function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		// Simuler l'envoi
		setTimeout(() => {
			loading = false;
			email = "";
		}, 1500);
	}
</script>

<div class="overflow-auto h-full bg-base-200">
	<!-- Hero Section -->
	<div class="hero min-h-[80vh] bg-base-100">
		<div class="hero-content text-center">
			<div class="max-w-2xl">
				<h1 class="text-5xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
					ZephyVid
				</h1>
				<p class="text-2xl mb-12">
					Vos vidéos, votre cercle, votre contrôle.
				</p>
				<form on:submit={handleSubmit} class="join justify-center">
					<input
						type="email"
						placeholder="Votre email"
						class="input input-bordered join-item w-full max-w-xs"
						bind:value={email}
						required
					/>
					<button class="btn btn-primary join-item" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner" />
						{:else}
							Demander une invitation
							<ChevronRight class="w-4 h-4" />
						{/if}
					</button>
				</form>
				<div class="divider">OU</div>
				<div>
					<a href="/login" class="btn btn-outline">
						Se connecter à votre compte
					</a>
				</div>
				<div class="flex items-center gap-2 mt-4 justify-center text-base-content/70">
					<Shield class="w-4 h-4" />
					<span class="text-sm">Sur invitation uniquement</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<section class="py-24 bg-base-200">
		<div class="container mx-auto px-4 max-w-7xl">
			<div class="text-center mb-16">
				<h2 class="text-4xl font-bold mb-4">Fonctionnalités principales</h2>
				<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
					Une plateforme conçue pour offrir un contrôle total sur vos contenus et leur diffusion
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Upload Feature -->
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body">
						<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
							<Upload class="w-6 h-6 text-primary" />
						</div>
						<h3 class="card-title text-xl mb-2">Upload privé</h3>
						<p class="text-base-content/70">
							Choisissez qui peut voir vos vidéos avec trois modes de visibilité :
						</p>
						<ul class="mt-4 space-y-2">
							<li class="flex items-center gap-2">
								<Lock class="w-4 h-4 text-primary" />
								<span>Privé - Uniquement vous</span>
							</li>
							<li class="flex items-center gap-2">
								<Eye class="w-4 h-4 text-primary" />
								<span>Non répertorié - Via lien</span>
							</li>
							<li class="flex items-center gap-2">
								<Users class="w-4 h-4 text-primary" />
								<span>Personnalisé - Groupe restreint</span>
							</li>
						</ul>
					</div>
				</div>

				<!-- Invitation System Feature -->
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body">
						<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
							<UserPlus class="w-6 h-6 text-primary" />
						</div>
						<h3 class="card-title text-xl mb-2">Système d'invitation</h3>
						<p class="text-base-content/70">
							Un environnement sécurisé et contrôlé grâce à notre système d'invitation :
						</p>
						<ul class="mt-4 space-y-2">
							<li class="flex items-center gap-2">
								<Shield class="w-4 h-4 text-primary" />
								<span>Accès restreint</span>
							</li>
							<li class="flex items-center gap-2">
								<Users class="w-4 h-4 text-primary" />
								<span>Communauté de confiance</span>
							</li>
							<li class="flex items-center gap-2">
								<Lock class="w-4 h-4 text-primary" />
								<span>Contrôle total des accès</span>
							</li>
						</ul>
					</div>
				</div>

				<!-- Statistics Feature -->
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body">
						<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
							<BarChart3 class="w-6 h-6 text-primary" />
						</div>
						<h3 class="card-title text-xl mb-2">Statistiques détaillées</h3>
						<p class="text-base-content/70">
							Suivez l'engagement sur vos contenus avec des statistiques précises :
						</p>
						<ul class="mt-4 space-y-2">
							<li class="flex items-center gap-2">
								<Eye class="w-4 h-4 text-primary" />
								<span>Nombre de vues</span>
							</li>
							<li class="flex items-center gap-2">
								<Users class="w-4 h-4 text-primary" />
								<span>Utilisation des invitations</span>
							</li>
							<li class="flex items-center gap-2">
								<BarChart3 class="w-4 h-4 text-primary" />
								<span>Métriques d'engagement</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-24 bg-base-100">
		<div class="container mx-auto px-4 max-w-3xl text-center">
			<h2 class="text-4xl font-bold mb-6">Prêt à rejoindre notre communauté ?</h2>
			<p class="text-lg text-base-content/70 mb-8">
				Demandez une invitation et commencez à partager vos vidéos en toute sécurité.
			</p>
			<form on:submit={handleSubmit} class="join justify-center">
				<input
					type="email"
					placeholder="Votre email"
					class="input input-bordered join-item w-full max-w-xs"
					bind:value={email}
					required
				/>
				<button class="btn btn-primary join-item" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner" />
					{:else}
						Demander une invitation
						<ChevronRight class="w-4 h-4" />
					{/if}
				</button>
			</form>
			<p class="mt-4 text-sm text-base-content/70">
				Nous examinerons votre demande et vous recontacterons rapidement.
			</p>
		</div>
	</section>
</div>
