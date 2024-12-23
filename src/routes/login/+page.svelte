<script lang="ts">
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let loading = $state(false);

	let { form }: { form: ActionData } = $props();

	function onsubmit() {
		if (form) form.message = '';
		loading = true;
	}

	$effect(() => {
		if (form?.message) {
			loading = false;
		}
	});
</script>

<main class="h-dvh">
	<div class="flex min-h-full">
		<div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6">
			<div class="mx-auto w-full max-w-sm lg:w-96">
				<div class="mt-10">
					<h2 class="mt-8 text-2xl font-bold leading-9 tracking-tight text-primary">Connexion</h2>
					<p class="mt-2 text-sm leading-6">
						Pas encore enregistré ?
						<a href="/register" class="font-semibold text-primary hover:text-secondary">Crée un compte</a>
					</p>
					<form class="simple_form new_user" id="new_user" action="?/login" method="POST"  use:enhance onsubmit={onsubmit}>
						<div class="form-inputs mt-2">
							<div class="form-control mb-2 form-control-wrap">
								<label
									class="input input-bordered input-color-transition flex items-center gap-2 { form?.message ? 'input-error' : '' }">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
											 class="w-4 h-4 opacity-70">
										<path
											d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
										<path
											d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
									</svg>
									<input
										class="w-full"
										autocomplete="email"
										placeholder="Nom d'utilisateur" type="text"
										name="username" id="user_login">
								</label>
								<label class="label hint" for="user_login"></label>
							</div>
							<div class="form-control mb-2 form-control-wrap">
								<label
									class="input input-bordered input-color-transition flex items-center gap-2 { form?.message ? 'input-error' : '' }">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
											 class="w-4 h-4 opacity-70">
										<path fill-rule="evenodd"
													d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
													clip-rule="evenodd" />
									</svg>
									<input class="w-full"
												 autocomplete="current-password" placeholder="Mot de passe"
												 type="password" name="password"
												 id="user_password">
								</label>
								<label class="label hint" for="user_password"></label>
							</div>
							{#if form?.message}
								<div transition:slide role="alert" class="alert alert-error mb-2 p-1.5 rounded-xl text-sm">
									<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
											 viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
													d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>{form?.message}</span>
								</div>
								<label class="label hint" for=""></label>
							{/if}
						</div>
						<div class="form-actions">
							<button type="submit" name="commit" class="btn btn-primary w-full"
											data-disable-with="Log in" disabled="{loading}">
								{#if (loading)}<span class="loading loading-spinner"></span>{/if}
								Se connecter
							</button>
						</div>
					</form>
					<div class="mt-2">
						<a href="/password/reset">Mot de passe oublié ?</a><br>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
    .input-color-transition {
        transition: border-color 500ms ease;
    }
</style>
