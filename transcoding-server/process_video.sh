#!/usr/bin/env bash

#===============================================================================
# Script de transcodage HLS multi-résolutions en une seule commande,
# avec publication de la progression, génération de miniatures et
# création d'une "sprite sheet" + WebVTT pour l'aperçu timeline.
#
# EXEMPLE d’usage :
#   ./process_video.sh "input.mp4" "out_dir" "VIDEO_ID" "API_KEY"
#===============================================================================

#----------------------------
# 1) Variables d'entrée
#----------------------------
input_file="$1"   # Chemin de la vidéo originale
output_dir="$2"   # Répertoire de sortie pour les fichiers générés
video_id="$3"     # ID de la vidéo (pour organiser les fichiers)
api_key="$4"      # Clé d'API pour l'API Node.js

# URL de l'API Node.js pour publier la progression
progress_api_url="http://localhost:5173/api/video/progress"

#-----------------------------------------------------------------------------
# 2) Fonctions de publication de progression
#-----------------------------------------------------------------------------
publish_progress() {
    local percentage=$1
    curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: $api_key" \
        -d "{\"videoId\": \"$video_id\", \"progress\": $percentage}" \
        "$progress_api_url"
}

publish_weighted_progress() {
    local local_progress=$1     # Progression locale de 0 à 100
    local range_start=$2        # Début de plage (en %)
    local range_end=$3          # Fin de plage (en %)

    # Calcul de la progression globale pondérée
    global_progress=$(awk "BEGIN {print $range_start + ($local_progress * ($range_end - $range_start) / 100)}")

    # Publication via l'API
    curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: $api_key" \
        -d "{\"videoId\": \"$video_id\", \"progress\": $global_progress}" \
        "$progress_api_url"
}

# Pour commencer : progression à 0 %
publish_progress 0

#-----------------------------------------------------------------------------
# 3) Création du dossier de sortie
#-----------------------------------------------------------------------------
mkdir -p "$output_dir"

#-----------------------------------------------------------------------------
# 4) Génération de 5 miniatures (pour aperçu utilisateur, en pleine résolution)
#-----------------------------------------------------------------------------
ffmpeg -i "$input_file" -vf "thumbnail,scale=-1:-1" -frames:v 5 "$output_dir/full_thumbnail_%03d.jpg"
publish_progress 5

#-----------------------------------------------------------------------------
# 5) Détection de la résolution d'entrée
#-----------------------------------------------------------------------------
resolution=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
                     -of csv=p=0 "$input_file")
width=$(echo "$resolution" | cut -d',' -f1)
height=$(echo "$resolution" | cut -d',' -f2)

# Détermination dynamique des résolutions à générer (basé sur la hauteur)
resolutions=()
if (( height >= 2160 )); then
  resolutions=(2160 1440 1080 720 480 360 240 144)
elif (( height >= 1440 )); then
  resolutions=(1440 1080 720 480 360 240 144)
elif (( height >= 1080 )); then
  resolutions=(1080 720 480 360 240 144)
elif (( height >= 720 )); then
  resolutions=(720 480 360 240 144)
elif (( height >= 480 )); then
  resolutions=(480 360 240 144)
elif (( height >= 360 )); then
  resolutions=(360 240 144)
elif (( height >= 240 )); then
  resolutions=(240 144)
else
  resolutions=(144)
fi

echo "Résolutions à générer : ${resolutions[*]}"

#-----------------------------------------------------------------------------
# 6) Bitrate audio
#-----------------------------------------------------------------------------
declare -A audio_bitrates
audio_bitrates[2160]="192k"
audio_bitrates[1440]="192k"
audio_bitrates[1080]="128k"
audio_bitrates[720]="128k"
audio_bitrates[480]="96k"
audio_bitrates[360]="96k"
audio_bitrates[240]="64k"
audio_bitrates[144]="64k"

# 1) Détection FPS
fps_str=$(ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate "$input_file")
eval $(awk -F/ '{
    if (NF == 1) {
        printf("fps=%d\n", $1);
    } else {
        printf("fps=%f\n", $1/$2);
    }
}' <<< "$fps_str")

echo "FPS détecté : $fps"

# On calcule g_value comme 2 * fps, en arrondissant à l'entier le plus proche
g_value=$(awk -v f="$fps" 'BEGIN {printf("%.0f", 4.0 * f)}')
echo "Valeur de -g / -keyint_min : $g_value"

# 2) Calcul du facteur selon FPS
bitrate_factor=1.0
if (( $(awk 'BEGIN {print ('"$fps"' > 30 && '"$fps"' <= 60)?1:0}') == 1 )); then
  bitrate_factor=1.3
elif (( $(awk 'BEGIN {print ('"$fps"' > 60)?1:0}') == 1 )); then
  bitrate_factor=2.0
fi

# 3) Table de base (pour ~30 FPS)
declare -A video_bitrates_base
video_bitrates_base[2160]=12000  # en kbps
video_bitrates_base[1440]=6000
video_bitrates_base[1080]=4000
video_bitrates_base[720]=2800
video_bitrates_base[480]=1400
video_bitrates_base[360]=800
video_bitrates_base[240]=500
video_bitrates_base[144]=300

# 4) On génère la table réelle "video_bitrates" en multipliant par le facteur
declare -A video_bitrates
declare -A video_bufsizes

for res in "${!video_bitrates_base[@]}"; do
  base_kbps="${video_bitrates_base[$res]}"
  adjusted_kbps=$(awk -v base="$base_kbps" -v factor="$bitrate_factor" \
                   'BEGIN {printf "%.0f", base*factor}')

  video_bitrates[$res]="${adjusted_kbps}k"
  # Buffer size ~= 2x le bitrate
  bufsize_kbps=$((adjusted_kbps * 2))
  video_bufsizes[$res]="${bufsize_kbps}k"
done

#-----------------------------------------------------------------------------
# 8) Construction du filter_complex (split + scale) pour toutes les résolutions
#-----------------------------------------------------------------------------
num_res=${#resolutions[@]}
filter_complex="[0:v]split=${num_res}"
for i in "${!resolutions[@]}"; do
  filter_complex+="[v$i]"
done

for i in "${!resolutions[@]}"; do
  res="${resolutions[$i]}"
  filter_complex+=";[v$i]scale=-2:${res}[v${i}out]"
done

#-----------------------------------------------------------------------------
# 9) Préparation des options -map et var_stream_map
#-----------------------------------------------------------------------------
video_codec="libx265"  # Codec CPU-based (pas de carte graphique nécessaire)
map_args=""
var_stream_map=""

for i in "${!resolutions[@]}"; do
  res="${resolutions[$i]}"

  # Ex. pour un « CBR » approximatif : -b:v, -maxrate, -minrate ont la même valeur.
  # bufsize détermine lissage / tolérance.
  map_args+=" -map [v${i}out] -c:v:${i} ${video_codec}"
  map_args+=" -b:v:${i} ${video_bitrates[$res]}"
  map_args+=" -maxrate:v:${i} ${video_bitrates[$res]}"
  map_args+=" -minrate:v:${i} ${video_bitrates[$res]}"
  map_args+=" -bufsize:v:${i} ${video_bufsizes[$res]}"
  map_args+=" -preset:v:${i} medium -tune:v:${i} zerolatency"
  map_args+=" -g $g_value -keyint_min $g_value"

  # Audio
  map_args+=" -map a:0 -c:a:${i} aac -b:a:${i} ${audio_bitrates[$res]}"

  # Contruction du var_stream_map
  var_stream_map+="v:${i},a:${i} "
done

# Supprimer l'espace finale dans var_stream_map
var_stream_map=$(echo "$var_stream_map" | xargs)

#-----------------------------------------------------------------------------
# 10) Préparation de la commande FFmpeg finale
#-----------------------------------------------------------------------------
total_duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration \
                -of csv=p=0 "$input_file" | awk '{print int($1)}')
publish_progress 10

cmd="ffmpeg -hide_banner -y \
  -i \"$input_file\" \
  -filter_complex \"$filter_complex\" \
  $map_args \
  -f hls \
  -hls_time 4 \
  -hls_segment_type fmp4 \
  -hls_flags independent_segments \
  -hls_list_size 0 \
  -var_stream_map \"$var_stream_map\" \
  -master_pl_name master.m3u8 \
  -hls_segment_filename \"$output_dir/%v/%03d.m4s\" \
  \"$output_dir/%v/index.m3u8\""

echo "========================================"
echo "Commande FFmpeg générée :"
echo "$cmd"
echo "========================================"

# Exécution de la commande avec parsing de la sortie pour la progression
range_start=10
range_end=95

eval "$cmd" 2>&1 | while read -r line; do
    if [[ "$line" =~ time=([0-9:.]+) ]]; then
        current_time=$(echo "${BASH_REMATCH[1]}" | awk -F: '{ print ($1 * 3600) + ($2 * 60) + $3 }')
        progress=$(awk "BEGIN { printf \"%.0f\", ($current_time / $total_duration) * 100 }")
        publish_weighted_progress "$progress" "$range_start" "$range_end"
    fi
done

# Une fois la commande terminée, on considère que le transcodage HLS est à 95%
publish_progress 95

#-----------------------------------------------------------------------------
# 11) Génération du « sprite sheet » et du fichier WebVTT
#-----------------------------------------------------------------------------
fps=1/3  # Une vignette toutes les 3 secondes
duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration \
            -of csv=p=0 "$input_file" | awk '{print int($1)}')
total_thumbnails=$(( (duration + 3 - 1) / 3 ))

columns=10
rows=$(( (total_thumbnails + columns - 1) / columns ))

sprite_sheet="$output_dir/thumbnails.jpg"
ffmpeg -y -i "$input_file" -vf "fps=$fps,scale=160:-1,tile=${columns}x${rows}" -q:v 2 "$sprite_sheet"

sprite_dimensions=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
                     -of csv=p=0 "$sprite_sheet")
sprite_width=$(echo "$sprite_dimensions" | cut -d',' -f1)
sprite_height=$(echo "$sprite_dimensions" | cut -d',' -f2)

thumb_width=$((sprite_width / columns))
thumb_height=$((sprite_height / rows))

vtt_file="$output_dir/thumbnails.vtt"
echo "WEBVTT" > "$vtt_file"

timestamp=0
x=0
y=0

for ((i = 0; i < total_thumbnails; i++)); do
  start=$(printf "%02d:%02d:%02d.000" $((timestamp / 3600)) $((timestamp % 3600 / 60)) $((timestamp % 60)))
  end=$(printf "%02d:%02d:%02d.000" $(((timestamp + 3) / 3600)) $(((timestamp + 3) % 3600 / 60)) $(((timestamp + 3) % 60)))

  echo "" >> "$vtt_file"
  echo "$start --> $end" >> "$vtt_file"
  echo "thumbnails.jpg#xywh=$x,$y,$thumb_width,$thumb_height" >> "$vtt_file"

  x=$((x + thumb_width))
  if ((x >= thumb_width * columns)); then
    x=0
    y=$((y + thumb_height))
  fi

  timestamp=$((timestamp + 3))
done

#-----------------------------------------------------------------------------
# 12) Finalisation
#-----------------------------------------------------------------------------
publish_progress 100
echo "Transcodage et génération de miniatures terminés pour : $input_file"
