<script lang="ts">
	/**
	 * Type utilitaire pour des classes CSS arbitraires (p. ex. "my-2 px-4 ...").
	 */
	export type CssClasses = string;

	/**
	 * On expose `bind:files` (un FileList) pour récupérer le fichier dans le parent.
	 */
	export let files: FileList | undefined = undefined;

	/**
	 * Référence interne du <input type="file"> pour manipuler
	 * ou déclencher un .click() si besoin.
	 */
	export let fileInput: HTMLInputElement | undefined = undefined;

	/**
	 * Nom du champ <input> (obligatoire si on veut qu’il soit reconnu en form data).
	 */
	export let name: string;

	/**
	 * Styles de base pour la dropzone (bordure, paddings, etc.).
	 * Tu peux personnaliser selon tes besoins (taille, couleurs...).
	 */
	export let border: CssClasses = 'border-2 border-dashed';
	export let padding: CssClasses = 'p-4 py-8';
	export let rounded: CssClasses = 'rounded-xl'; // ex: large radius

	/**
	 * Surcharge de styles pour la zone de texte (interface).
	 */
	export let regionInterface: CssClasses = '';
	export let regionInterfaceText: CssClasses = '';

	/**
	 * Slots de styles pour le contenu (ex: lead, message, meta).
	 */
	export let slotLead: CssClasses = 'mb-4';
	export let slotMessage: CssClasses = '';
	export let slotMeta: CssClasses = 'opacity-75';

	// Classes de base internes
	const cBase = 'relative flex justify-center items-center';
	const cInput = 'w-full h-full absolute top-0 left-0 z-[1] opacity-0 cursor-pointer';
	const cInterface = 'flex flex-col justify-center items-center text-center';

	// On calcule les classes finales
	$: classesBase = `${cBase} ${border} ${padding} ${rounded} ${$$props.class ?? ''}`;
	$: classesInput = `${cInput}`;
	$: classesInterface = `${cInterface}`;

	/**
	 * On pourrait exposer des events on:change, on:drop, etc. selon besoin,
	 * mais ici on laisse SvelteKit s’en charger via $$restProps.
	 */
	function prunedRestProps() {
		delete $$restProps.class;
		return $$restProps;
	}
</script>

<!-- Conteneur principal -->
<div class="dropzone {classesBase}" data-testid="file-dropzone">
	<!-- L'input file est masqué visuellement (opacity=0),
	     mais capte les évènements drag'n'drop et le clic -->
	<input
		bind:files
		bind:this={fileInput}
		type="file"
		{name}
		class="dropzone-input {classesInput}"
		{...prunedRestProps()}
	/>
	<!-- Interface utilisateur (texte, icônes...) -->
	<div class="dropzone-interface {classesInterface} {regionInterface}">
		<div class="dropzone-interface-text {regionInterfaceText}">
			<!-- Slot "lead" (titre, icône, etc.) -->
			{#if $$slots.lead}
				<div class="flex justify-center {slotLead}">
					<slot name="lead" />
				</div>
			{/if}
			<!-- Slot "message" (texte principal) -->
			<div class="dropzone-message {slotMessage}">
				<slot name="message"><strong>Upload a file</strong> or drag and drop</slot>
			</div>
			<!-- Slot "meta" (infos complémentaires) -->
			{#if $$slots.meta}
				<small class="dropzone-meta {slotMeta}">
					<slot name="meta" />
				</small>
			{/if}
		</div>
	</div>
</div>
