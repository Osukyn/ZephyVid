import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration Redis (adapter BullMQ)
const connection = new IORedis({
	host: '127.0.0.1',
	port: 6379,
	maxRetriesPerRequest: null,
	enableReadyCheck: false
});
const queueName = 'transcode';

// Fonction fictive pour mettre à jour la base de données
async function updateVideoStatus(videoId, status) {
	console.log(`Mise à jour de la DB : vidéo ${videoId}, statut=${status}`);
	if (!videoId) throw new Error('ID de vidéo manquant');
	if (status !== 'ready' && status !== 'error') throw new Error('Statut de vidéo invalide');

	await fetch(`http://localhost:5173/api/video/transcode/end`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': process.env.API_KEY
		},
		body: JSON.stringify({ videoId: videoId, status })
	});
}

// Crée un worker pour BullMQ
const transcodeWorker = new Worker(
	queueName,
	async (job) => {
		const { videoId, filePath, outputDir } = job.data;

		if (!videoId || !filePath || !outputDir) {
			throw new Error(
				`Paramètres manquants ou invalides : videoId=${videoId}, filePath=${filePath}, outputDir=${outputDir}`
			);
		}

		console.log(`Traitement en cours pour la vidéo ID: ${videoId}`);

		try {
			// Appeler un script ou exécuter une commande FFmpeg
			const { stdout, stderr } = await execAsync(
				`bash ./process_video.sh "${filePath}" "${outputDir}" "${videoId}" "${process.env.API_KEY}" ` // Timeout de 5 minutes
			);

			console.log('Traitement terminé :', stdout);
			if (stderr) console.warn('Avertissements :', stderr);

			// Mettre à jour la DB ici
			await updateVideoStatus(videoId, 'ready');

			return { success: true };
		} catch (err) {
			console.error(`Erreur lors du traitement de la vidéo ID: ${videoId}`, err);
			await updateVideoStatus(videoId, 'error');
			throw err;
		}
	},
	{ connection }
);

// Gestion des événements
transcodeWorker.on('completed', (job) => {
	console.log(`Job terminé pour ID: ${job.id}`);
});

transcodeWorker.on('failed', (job, err) => {
	console.error(`Job échoué pour ID: ${job.id}`, err);
});

// Maintient le processus actif
console.log(`Worker pour la queue "${queueName}" démarré`);
