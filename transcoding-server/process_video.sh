#!/bin/bash

# Entrées
input_file="$1"   # Chemin de la vidéo originale
output_dir="$2"   # Répertoire de sortie pour les fichiers générés
video_id="$3"     # ID de la vidéo (pour organiser les fichiers)
api_key="$4"      # Clé d'API pour l'API Node.js

# URL de l'API Node.js
progress_api_url="http://localhost:5173/api/video/progress"

publish_progress() {
    local percentage=$1
    curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: $api_key" \
        -d "{\"videoId\": \"$video_id\", \"progress\": $percentage}" \
        "$progress_api_url"
}

# Fonction pour publier une progression pondérée
publish_weighted_progress() {
    local local_progress=$1     # Progression locale (0 à 100 pour une commande)
    local range_start=$2        # Début de la plage (exemple : 5%)
    local range_end=$3          # Fin de la plage (exemple : 20%)

    echo "Progression locale : $local_progress"
    echo "Plage : $range_start - $range_end"

    # Calcul de la progression globale
    global_progress=$(awk "BEGIN {print $range_start + ($local_progress * ($range_end - $range_start) / 100)}")

    echo "Progression : $global_progress"
    # Publie la progression via l'API
    curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: $api_key" \
        -d "{\"videoId\": \"$video_id\", \"progress\": $global_progress}" \
        "$progress_api_url"
}

publish_progress 0

# Crée le répertoire de sortie
mkdir -p "$output_dir"

# Récupère la résolution d'entrée
resolution=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$input_file")
width=$(echo $resolution | cut -d',' -f1)
height=$(echo $resolution | cut -d',' -f2)

# Détermine les résolutions à générer
resolutions=()
if (( width >= 3840 )); then
  resolutions=(2160 1440 1080 720 480 360 240 144)
elif (( width >= 2560 )); then
  resolutions=(1440 1080 720 480 360 240 144)
elif (( width >= 1920 )); then
  resolutions=(1080 720 480 360 240 144)
elif (( width >= 1280 )); then
  resolutions=(720 480 360 240 144)
else
  resolutions=(480 360 240 144)
fi

echo "Résolutions à générer : ${resolutions[*]}"

# Bitrates fixes par résolution
declare -A bitrates
bitrates[2160]="20000k"
bitrates[1440]="10000k"
bitrates[1080]="5000k"
bitrates[720]="2500k"
bitrates[480]="1000k"
bitrates[360]="800k"
bitrates[240]="500k"
bitrates[144]="300k"

declare -A audio_bitrates
audio_bitrates[2160]="192k"
audio_bitrates[1440]="192k"
audio_bitrates[1080]="128k"
audio_bitrates[720]="128k"
audio_bitrates[480]="96k"
audio_bitrates[360]="96k"
audio_bitrates[240]="64k"
audio_bitrates[144]="64k"


# Génère 5 miniatures pour que l'utilisateur puisse choisir (full résolution)
ffmpeg -i "$input_file" -vf "thumbnail,scale=-1:-1" -frames:v 5 "$output_dir/full_thumbnail_%03d.jpg"

publish_progress 5

# Récupérer la durée totale en secondes
total_duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$input_file" | awk '{print int($1)}')

for i in "${!resolutions[@]}"; do
    res="${resolutions[$i]}"
    range_start=$((5 + (i * 90 / ${#resolutions[@]})))
    range_end=$((5 + ((i + 1) * 90 / ${#resolutions[@]})))

    ffmpeg -hide_banner -y -i "$input_file" \
        -vf "scale=w=-2:h=$res" \
        -c:v h264_videotoolbox -profile:v main -crf 20 -sc_threshold 0 -g 48 -keyint_min 48 \
        -hls_time 4 -hls_playlist_type vod \
        -b:v "${bitrates[$res]}" -maxrate "${bitrates[$res]}" -bufsize "$((${bitrates[$res]%k} * 2))k" \
        -c:a aac -b:a "${audio_bitrates[$res]}" \
        -hls_segment_filename "$output_dir/${res}p_%03d.ts" \
        "$output_dir/${res}p.m3u8" 2>&1 | while read -r line; do
            if [[ "$line" =~ time=([0-9:.]+) ]]; then
                current_time=$(echo "${BASH_REMATCH[1]}" | awk -F: '{ print ($1 * 3600) + ($2 * 60) + $3 }')
                progress=$(awk "BEGIN { printf \"%.0f\", ($current_time / $total_duration) * 100 }")
                publish_weighted_progress "$progress" "$range_start" "$range_end"
            fi
        done
done

publish_progress 95

# Génération de la master playlist
master_playlist="$output_dir/master.m3u8"
echo "#EXTM3U" > "$master_playlist"
for res in "${resolutions[@]}"; do
  # Récupère les dimensions exactes pour chaque résolution
  output_width=$((res * width / height))
  resolution_string="${output_width}x${res}"

  # Ajoute les entrées au fichier master
  bandwidth=$((${bitrates[$res]%k} * 1000))
  echo "#EXT-X-STREAM-INF:BANDWIDTH=$bandwidth,RESOLUTION=$resolution_string" >> "$master_playlist"
  echo "${res}p.m3u8" >> "$master_playlist"
done

publish_progress 96

# Paramètres pour les thumbnails
fps=1/3    # Une vignette toutes les 3 secondes
duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$input_file" | awk '{print int($1)}')

# Calculer le nombre total de thumbnails
total_thumbnails=$(( (duration + 3 - 1) / 3 ))

# Limiter le nombre de colonnes pour éviter une seule ligne trop longue
columns=10  # Limiter à 10 thumbnails par ligne
rows=$(( (total_thumbnails + columns - 1) / columns )) # Calcul des lignes nécessaires

# Commande FFmpeg pour générer la sprite sheet
sprite_sheet="$output_dir/thumbnails.jpg"
ffmpeg -y -i "$input_file" -vf "fps=$fps,scale=160:-1,tile=${columns}x${rows}" -q:v 2 "$sprite_sheet"

# Obtenir les dimensions réelles de la sprite sheet
sprite_dimensions=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$sprite_sheet")
sprite_width=$(echo $sprite_dimensions | cut -d',' -f1)
sprite_height=$(echo $sprite_dimensions | cut -d',' -f2)

# Calculer les dimensions des thumbnails
width=$((sprite_width / columns))
height=$((sprite_height / rows))

# Génération du fichier WebVTT pour les vignettes
vtt_file="$output_dir/thumbnails.vtt"
echo "WEBVTT" > "$vtt_file"

timestamp=0
x=0
y=0

for ((i = 0; i < total_thumbnails; i++)); do
  # Calcul des timestamps en HH:MM:SS
  start=$(printf "%02d:%02d:%02d.000" $((timestamp / 3600)) $((timestamp % 3600 / 60)) $((timestamp % 60)))
  end=$(printf "%02d:%02d:%02d.000" $(((timestamp + 3) / 3600)) $(((timestamp + 3) % 3600 / 60)) $(((timestamp + 3) % 60)))

  # Ajouter les entrées WebVTT
  echo "" >> "$vtt_file"
  echo "$start --> $end" >> "$vtt_file"
  echo "thumbnails.jpg#xywh=$x,$y,$width,$height" >> "$vtt_file"

  # Mise à jour des coordonnées pour la grille
  x=$((x + width))
  if ((x >= width * columns)); then
    x=0
    y=$((y + height))
  fi

  # Incrémenter le timestamp
  timestamp=$((timestamp + 3))
done

publish_progress 100

echo "Traitement terminé pour $input_file"
