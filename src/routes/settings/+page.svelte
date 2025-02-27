<script lang="ts">
	import { enhance } from '$app/forms';
	import { Camera, User, Lock, Upload, Loader2, Check, X } from 'lucide-svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let { data, form } = $props();

	let loading = $state(false);
	let successMessage: string | null = $state(null);
	let avatar = $state(data.user.profileImage ? `http://localhost/${data.user.profileImage}` : '');
	let tempAvatar: string | null = $state(null);
	let oldUsername = $state(data.userInfos.username);
	let oldEmail = $state(data.userInfos.email);
	let username = $state(data.userInfos.username);
	let email = $state(data.userInfos.email);
	let invalidPassword = $state(false);
	let invalidEmail = $state(false);
	let invalidPasswordConfirmation = $state(false);
	let invalidUsername = $state(false);
	let password = $state('');
	let passwordConfirmation = $state('');

	$effect(() => {
		if (form && form.data) {
			username = form.data.username;
			email = form.data.email;
			oldUsername = form.data.username;
			oldEmail = form.data.email;
			avatar = `http://localhost/${form.data.profileImage}`;
		}
	});

	// Avatar update handler (client-side simulation)
	function handleAvatarSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Affiche l'aperçu temporaire
			tempAvatar = URL.createObjectURL(file);
		}
	}

	function handleAvatarConfirm() {
		return async ({ update, result }) => {
			loading = true;
			update().then(() => {
				loading = false;
				if (result.type === 'success') {
					avatar = tempAvatar;
					tempAvatar = null;
					showSuccess('Photo de profil mise à jour avec succès');
				}
			});
		};
	}

	function handleAvatarCancel() {
		tempAvatar = null;
		document.getElementById('pp-input').value = '';
	}

	// Affichage d'un message de succès temporaire
	function showSuccess(message: string) {
		successMessage = message;
		setTimeout(() => successMessage = null, 3000);
	}

	// Form submission handler
	async function handleSubmit() {
		return async ({ update, result }) => {
			loading = true;
			update().then(() => {
				loading = false;
				if (result.type === 'success') showSuccess('Modifications enregistrées avec succès');
			});
		};
	}

	async function handlePasswordUpdate() {
		return async ({ update, result }) => {
			loading = true;
			update().then(() => {
				loading = false;
				if (result.type === 'success') showSuccess('Mot de passe mis à jour avec succès');
			});
		};
	}

	function validateUsername(event) {
		invalidUsername = event.target.value.length < 3;
	}

	function validateEmail(event) {
		invalidEmail = !(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(event.target.value));
	}

	function validatePassword(event) {
		const value = event.target.value;
		const minLength = value.length >= 8;
		const maxLength = value.length <= 72;
		const upperCase = /[A-Z]/.test(value);
		const lowerCase = /[a-z]/.test(value);
		const digit = /\d/.test(value);
		const passwordConfirmation = document.getElementById('user_password_confirmation')?.value || '';

		invalidPassword = !(minLength && upperCase && lowerCase && digit && maxLength);

		validatePasswordConfirmation({ target: { value: passwordConfirmation } });
	}

	function validatePasswordConfirmation(event) {
		const password = document.getElementById('user_password')?.value || '';
		const passwordConfirmation = event.target.value;

		invalidPasswordConfirmation = password !== passwordConfirmation;
	}
</script>

<div class="overflow-auto h-full bg-base-200 py-4">
	<div class="container mx-auto px-4 max-w-3xl">
		<h1 class="text-2xl font-bold mb-8">Paramètres du compte</h1>

		{#if successMessage}
			<div class="absolute bottom-4 right-4 z-10 h-fit"
					 transition:fly={{ duration: 300, x: 0, y: 10, easing: cubicInOut }}>
				<div class="alert alert-success">
					<Check class="w-5 h-5" />
					<span>{successMessage}</span>
				</div>
			</div>
		{/if}

		<!-- Photo de profil -->
		<form method="post" action="?/updateAvatar" use:enhance={handleAvatarConfirm} enctype="multipart/form-data">
			<div class="card bg-base-100 shadow-xl mb-6">
				<div class="card-body">
					<h2 class="card-title">
						<Camera class="w-5 h-5" />
						Photo de profil
					</h2>
					<div class="flex items-center gap-6 mt-4">
						<Avatar avatarUrl={tempAvatar || avatar} size="w-24 h-24" fallbackName={data.user?.username || ''}>
							{#if tempAvatar}
								<div class="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 rounded-full">
									<div class="flex gap-2">
										<button
											class="btn btn-circle btn-sm btn-success"
											type="submit"
											disabled={loading}
										>
											{#if loading}
												<Loader2 class="w-4 h-4 animate-spin" />
											{:else}
												<Check class="w-4 h-4" />
											{/if}
										</button>
										<button
											class="btn btn-circle btn-sm btn-error"
											onclick={handleAvatarCancel}
											disabled={loading}
										>
											<X class="w-4 h-4" />
										</button>
									</div>
								</div>
							{/if}
						</Avatar>
						<div class="flex-1">
							<h3 class="font-medium mb-2">Changer votre photo</h3>
							<div class="flex items-center flex-wrap gap-4">
								<label class="btn">
									<Upload class="w-4 h-4 mr-2" />
									Choisir une image
									<input id="pp-input" type="file" name="avatar" class="hidden" accept="image/*"
												 onchange={handleAvatarSelect}
												 disabled={loading} />
								</label>
								<p class="text-sm text-base-content/70">JPG, GIF ou PNG. 1MB max.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</form>

		<!-- Informations de profil -->
		<form method="post" action="?/updateProfile" use:enhance={handleSubmit}>
			<div class="card bg-base-100 shadow-xl mb-6">
				<div class="card-body">
					<h2 class="card-title">
						<User class="w-5 h-5" />
						Informations de profil
					</h2>
					<div class="grid gap-6 mt-4">
						<div class="form-control">
							<label class="label">
								<span class="label-text">Pseudo</span>
							</label>
							<input type="text" placeholder="Votre pseudo"
										 class="input input-bordered input-color-transition{ (form?.errors?.username && username === oldUsername) || invalidUsername ? ' input-error' : '' }"
										 name="username"
										 bind:value={username} oninput={validateUsername} />
							{#if form?.errors?.username && username === oldUsername || invalidUsername}
								<p class="text-error mt-1"
									 transition:fly={{ duration: 100, x: 0, y: -10, easing: cubicInOut }}>{form?.errors?.username && username === oldUsername ? form.errors.username : 'Le pseudo doit contenir au moins 3 caractères'}</p>
							{/if}
						</div>
						<div class="form-control">
							<label class="label">
								<span class="label-text">Adresse email</span>
							</label>
							<input type="email" placeholder="votre@email.com"
										 class="input input-bordered input-color-transition{ (form?.errors?.email && email === oldEmail) || invalidEmail ? ' input-error' : '' }"
										 name="email"
										 bind:value={email} oninput={validateEmail} />
							{#if form?.errors?.email && email === oldEmail || invalidEmail}
								<p class="text-error mt-1"
									 transition:fly={{ duration: 100, x: 0, y: -10, easing: cubicInOut }}>{form.errors.email && email === oldEmail ? form.errors.email : 'Adresse email invalide'}</p>
							{/if}
						</div>
						<div class="flex justify-end">
							<button type="submit" class="btn btn-primary"
											disabled={loading || username === oldUsername && email === oldEmail || invalidEmail || invalidUsername}>
								{#if loading}
									<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								{/if}
								Enregistrer les modifications
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>

		<!-- Sécurité -->
		<form method="post" action="?/updatePassword" use:enhance={handlePasswordUpdate}>
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">
						<Lock class="w-5 h-5" />
						Sécurité
					</h2>
					<div class="grid mt-4">
						<div class="form-control">
							<label class="label">
								<span class="label-text">Mot de passe actuel</span>
							</label>
							<input type="password"
										 class="input input-bordered input-color-transition{ form?.errors?.currentPassword ? ' input-error' : '' }"
										 placeholder="••••••••" name="currentPassword" required />
						</div>
						{#if form?.errors?.currentPassword}
							<p class="text-error mt-1"
								 transition:fly={{ duration: 100, x: 0, y: -10, easing: cubicInOut }}>{form?.errors?.currentPassword}</p>
						{/if}
						<div class="form-control mt-6">
							<label class="label">
								<span class="label-text">Nouveau mot de passe</span>
							</label>
							<input id="user_password" type="password"
										 class="input input-bordered input-color-transition{ form?.errors?.newPassword || invalidPassword ? ' input-error' : '' }"
										 placeholder="••••••••" name="newPassword" oninput={validatePassword} bind:value={password}
										 required />
						</div>
						{#if invalidPassword || form?.errors?.newPassword}
							<p class="text-error mt-1"
								 transition:fly={{ duration: 100, x: 0, y: -10, easing: cubicInOut }}>Le mot de passe doit contenir 8
								caractères minimum, incluant au moins 1 majuscule, 1 minuscule et 1 chiffre</p>
						{/if}
						<div class="form-control mt-6">
							<label class="label">
								<span class="label-text">Confirmer le mot de passe</span>
							</label>
							<input id="user_password_confirmation" type="password"
										 class="input input-bordered input-color-transition{ invalidPasswordConfirmation ? ' input-error' : '' }"
										 placeholder="••••••••"
										 name="confirmPassword" oninput={validatePasswordConfirmation} bind:value={passwordConfirmation}
										 required />
						</div>
						{#if invalidPasswordConfirmation}
							<p class="text-error mt-1"
								 transition:fly={{ duration: 100, x: 0, y: -10, easing: cubicInOut }}>Les mots de passe doivent être
								identiques</p>
						{/if}
						<div class="flex justify-end mt-6">
							<button type="submit" class="btn btn-primary"
											disabled={loading || invalidPassword || invalidPasswordConfirmation || password.length === 0 || passwordConfirmation.length === 0}>
								{#if loading}
									<Loader2 class="w-4 h-4 mr-2 animate-spin" />
								{/if}
								Mettre à jour le mot de passe
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>

<style>
    .input-color-transition {
        transition: border-color 500ms ease;
    }
</style>
