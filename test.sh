#!/usr/bin/env bash

bash --version

# Entrées
input_file="$1"
output_dir="$2"
video_id="$3"
api_key="$4"

# URL de l'API Node.js
progress_api_url="http://localhost:5173/api/video/progress"

publish_progress() {
    local percentage=$1
    curl -s -X POST -H "Content-Type: application/json" \
        -H "Authorization: $api_key" \
        -d "{\"videoId\": \"$video_id\", \"progress\": $percentage}" \
        "$progress_api_url"
}

publish_weighted_progress() {
    local local_progress=$1
    local range_start=$2
    local range_end=$3
    global_progress=$(awk "BEGIN {print $range_start + ($local_progress * ($range_end - $range_start) / 100)}")
    publish_progress "$global_progress"
}

publish_progress 0

# Crée le répertoire de sortie
mkdir -p "$output_dir"

# Récupère les métadonnées vidéo d'entrée
resolution=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$input_file")
width=$(echo $resolution | cut -d',' -f1)
height=$(echo $resolution | cut -d',' -f2)
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$input_file" | bc)
hdr=$(ffprobe -v error -select_streams v:0 -show_entries stream=bits_per_raw_sample -of csv=p=0 "$input_file")

is_hdr=false
[[ "$hdr" == "10" || "$hdr" == "12" ]] && is_hdr=true

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

# Bitrates ajustés pour HEVC
declare -A bitrates_sdr_30fps
bitrates_sdr_30fps[2160]="8000k"
bitrates_sdr_30fps[1440]="4000k"
bitrates_sdr_30fps[1080]="2000k"
bitrates_sdr_30fps[720]="1000k"
bitrates_sdr_30fps[480]="500k"
bitrates_sdr_30fps[360]="400k"
bitrates_sdr_30fps[240]="300k"
bitrates_sdr_30fps[144]="200k"

declare -A bitrates_sdr_60fps
bitrates_sdr_60fps[2160]="12000k"
bitrates_sdr_60fps[1440]="6000k"
bitrates_sdr_60fps[1080]="3000k"
bitrates_sdr_60fps[720]="1500k"
bitrates_sdr_60fps[480]="750k"
bitrates_sdr_60fps[360]="600k"
bitrates_sdr_60fps[240]="400k"
bitrates_sdr_60fps[144]="300k"

declare -A bitrates_hdr_30fps
bitrates_hdr_30fps[2160]="12000k"
bitrates_hdr_30fps[1440]="8000k"
bitrates_hdr_30fps[1080]="4000k"
bitrates_hdr_30fps[720]="2000k"
bitrates_hdr_30fps[480]="1000k"
bitrates_hdr_30fps[360]="750k"
bitrates_hdr_30fps[240]="500k"
bitrates_hdr_30fps[144]="300k"

declare -A bitrates_hdr_60fps
bitrates_hdr_60fps[2160]="18000k"
bitrates_hdr_60fps[1440]="12000k"
bitrates_hdr_60fps[1080]="6000k"
bitrates_hdr_60fps[720]="3000k"
bitrates_hdr_60fps[480]="1500k"
bitrates_hdr_60fps[360]="1000k"
bitrates_hdr_60fps[240]="600k"
bitrates_hdr_60fps[144]="400k"

declare -A audio_bitrates
audio_bitrates[2160]="192k"
audio_bitrates[1440]="192k"
audio_bitrates[1080]="128k"
audio_bitrates[720]="128k"
audio_bitrates[480]="96k"
audio_bitrates[360]="96k"
audio_bitrates[240]="64k"
audio_bitrates[144]="64k"

# Choisir les bitrates en fonction du HDR et FPS
declare -n bitrates # Utilisation d'une référence pour le tableau associatif

if [[ $is_hdr == true && $fps -ge 50 ]]; then
  bitrates=bitrates_hdr_60fps
elif [[ $is_hdr == true ]]; then
  bitrates=bitrates_hdr_30fps
elif [[ $fps -ge 50 ]]; then
  bitrates=bitrates_sdr_60fps
else
  bitrates=bitrates_sdr_30fps
fi

# Génère 5 miniatures pour que l'utilisateur puisse choisir (full résolution)
ffmpeg -i "$input_file" -vf "thumbnail,scale=-1:-1" -frames:v 5 "$output_dir/full_thumbnail_%03d.jpg"

publish_progress 5

# Récupérer la durée totale
total_duration=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$input_file" | awk '{print int($1)}')

for i in "${!resolutions[@]}"; do
    res="${resolutions[$i]}"
    range_start=$((5 + (i * 90 / ${#resolutions[@]})))
    range_end=$((5 + ((i + 1) * 90 / ${#resolutions[@]})))

    echo "Transcodage pour la résolution ${res}p..."
    echo "Bitrates video : ${bitrates[$res]} | Bitrates audio : ${audio_bitrates[$res]}"

    mkdir -p "$output_dir/${res}p"

    ffmpeg -hide_banner -y -i "$input_file" \
        -vf "scale=w=-2:h=$res" \
        -c:v hevc_videotoolbox -b:v "${bitrates[$res]}" \
        -c:a aac -b:a "${audio_bitrates[$res]}" \
        -hls_time 4 -hls_playlist_type vod \
        -hls_list_size 0 \
        -hls_segment_type fmp4 \
        -hls_flags independent_segments \
        -hls_segment_filename "$output_dir/${res}p/%03d.m4s" \
        "$output_dir/${res}p/index.m3u8"
done

publish_progress 95

# Génération de la master playlist
master_playlist="$output_dir/master.m3u8"
echo "#EXTM3U" > "$master_playlist"
for res in "${resolutions[@]}"; do
    # Calculer les dimensions pour le format "WIDTHxHEIGHT"
    output_width=$((res * width / height))
    resolution_string="${output_width}x${res}"

    # Ajout des codecs
    video_codec="hvc1.1.6.L93.B0" # Main profile
    [[ $is_hdr == true ]] && video_codec="hvc1.2.4.L150.B0" # Main 10 profile pour HDR

    # Calculer la bande passante (en bits/s)
    bandwidth=$((${bitrates[$res]%k} * 1000))

    echo "#EXT-X-STREAM-INF:BANDWIDTH=$bandwidth,RESOLUTION=$resolution_string,CODECS=\"$video_codec,mp4a.40.2\"" >> "$master_playlist"
    echo "${res}p/index.m3u8" >> "$master_playlist"
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
