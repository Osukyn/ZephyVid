<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	let invalidCredentials = false;
	let otherError = false;
	let loading = false;
	let invalidPassword = false;
	let invalidEmail = false;
	let invalidPasswordConfirmation = false;

	function validatePassword(event) {
		const value = event.target.value;
		const minLength = value.length >= 8;
		const upperCase = /[A-Z]/.test(value);
		const lowerCase = /[a-z]/.test(value);
		const digit = /\d/.test(value);
		const passwordConfirmation = document.getElementById('user_password_confirmation')?.value || '';

		invalidPassword = !(minLength && upperCase && lowerCase && digit);

		validatePasswordConfirmation({ target: { value: passwordConfirmation } });
	}

	function validateEmail(event) {
		invalidEmail = !(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(event.target.value));
	}

	function validatePasswordConfirmation(event) {
		const password = document.getElementById('user_password')?.value || '';
		const passwordConfirmation = event.target.value;

		invalidPasswordConfirmation = password !== passwordConfirmation;
	}
</script>

<main class="h-dvh">
	<div class="flex min-h-full">
		<div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6">
			<div class="mx-auto w-full max-w-sm lg:w-96">
				<div class="mt-10">
					<h2 class="mt-8 text-2xl font-bold leading-9 tracking-tight text-primary">Créer un compte</h2>
					<p class="mt-2 text-sm leading-6">
						Déjà enregistré?
						<a href="/login" class="font-semibold text-primary hover:text-secondary">Connecte-toi</a>
					</p>
					<form class="simple_form new_user" id="new_user" action="?/register" method="POST"
								use:enhance>
						<div class="form-inputs mt-4">
							<div class="form-control mb-2 form-control-wrap">
								<label
									class="input input-bordered input-color-transition flex items-center gap-2 { invalidCredentials ? 'input-error' : '' }">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
											 class="w-4 h-4 opacity-70">
										<path
											d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
									</svg>
									<input class="w-full"
												 required aria-required="true"
												 placeholder="Nom d'utilisateur" type="text" value=""
												 name="username" id="user_username">
								</label>
								<label class="label hint" for="user_username"></label>
							</div>
							<div class="form-control mb-2 form-control-wrap">
								<label
									class="input input-bordered input-color-transition flex items-center gap-2 { invalidCredentials || invalidEmail ? 'input-error' : '' }">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
											 class="w-4 h-4 opacity-70">
										<path
											d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
										<path
											d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
									</svg>
									<input class="w-full" autocomplete="email"
												 required aria-required="true"
												 placeholder="E-mail" type="email" value=""
												 name="email" id="user_email" on:input={validateEmail}>
								</label>
								<label class="label hint" for="user_email"></label>
							</div>
							<div class="form-control mb-2 form-control-wrap">
								<label
									class="input input-bordered input-color-transition flex items-center gap-2 { invalidCredentials || invalidPassword ? 'input-error' : '' }">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
											 class="w-4 h-4 opacity-70">
										<path fill-rule="evenodd"
													d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
													clip-rule="evenodd" />
									</svg>
									<input class="w-full" autocomplete="new-password"
												 required aria-required="true"
												 placeholder="Mot de passe" type="password"
												 name="password" id="user_password" on:input={validatePassword}>
								</label>
								<label class="label hint" for="user_password">
									<span class="label-text-alt">8 caractères minimum, incluant au moins 1 majuscule, 1 minuscule et 1 chiffre.</span>
								</label>
							</div>
							<div class="form-control mb-2 form-control-wrap">
								<label
									class="input input-bordered input-color-transition flex items-center gap-2 { invalidCredentials || invalidPasswordConfirmation ? 'input-error' : '' }">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
											 class="w-4 h-4 opacity-70">
										<path fill-rule="evenodd"
													d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
													clip-rule="evenodd" />
									</svg>
									<input class="w-full" autocomplete="new-password"
												 required aria-required="true"
												 placeholder="Confirmation du mot de passe" type="password"
												 name="password_confirmation"
												 id="user_password_confirmation" on:input={validatePasswordConfirmation}>
								</label>
								<label class="label hint" for="user_password_confirmation"></label></div>
							{#if invalidCredentials || otherError}
								<div transition:slide role="alert" class="alert alert-error mb-2 p-1.5 rounded-xl text-sm">
									<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
											 viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
													d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>{invalidCredentials ? "L'e-mail ou le mot de passe n'est pas valide." : "Une erreur s'est produite lors de la création."}</span>
								</div>
								<label class="label hint" for=""></label>
							{/if}
						</div>
						<div class="form-actions">
							<button type="submit" name="commit" class="btn btn-primary w-full"
											data-disable-with="Sign up" disabled="{loading}">
								{#if (loading)}<span class="loading loading-spinner"></span>{/if}
								Continuer
							</button>
						</div>
					</form>
					<div class="mt-2">
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
