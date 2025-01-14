import Hls from 'hls.js';
import { AbrController as DefaultAbrController } from 'hls.js';
//   selon la structure de votre build / dossier.

export default class CustomAbrController extends DefaultAbrController {
	constructor(hls: Hls) {
		super(hls);
	}

	/**
	 * Surcharge de la méthode findBestLevel(bw, minAutoLevel, maxAutoLevel, bufferStarvationDelay, ...)
	 * pour changer la logique de fallback.
	 */
	findBestLevel(
		currentBw,
		minAutoLevel,
		maxAutoLevel,
		bufferStarvationDelay,
		maxStarvationDelay,
		bwFactor,
		bwUpFactor
	) {
		// On appelle la méthode "super" pour profiter de la logique d'origine
		// (tri, skipping de certains niveaux, etc.)
		const levelFound = super.findBestLevel(
			currentBw,
			minAutoLevel,
			maxAutoLevel,
			bufferStarvationDelay,
			maxStarvationDelay,
			bwFactor,
			bwUpFactor
		);

		// Si super.findBestLevel() renvoie -1 => la bande passante estimée
		// est plus basse que tous les profiles => Par défaut, la version
		// officielle peut aboutir à un fallback sur un autre niveau
		// dans getNextABRAutoLevel(). Nous, on choisit explicitement index 0.
		if (levelFound === -1) {
			return 0;
		}

		// Sinon, tout va bien : on utilise le niveau trouvé par la logique parente
		return levelFound;
	}

	/**
	 * Surcharge possible de getNextABRAutoLevel() si vous souhaitez
	 * modifier plus profondément la sélection. Ici, on se contente
	 * de détecter un -1 (pas de niveau trouvé) pour forcer 0.
	 */
	getNextABRAutoLevel() {
		// On récupère l'auto-level de la classe parente
		const parentLevel = super.getNextABRAutoLevel();

		// Si la logique parente renvoie -1,
		// on force explicitement l'index 0
		if (parentLevel < 0) {
			return 0;
		}
		return parentLevel;
	}
}
