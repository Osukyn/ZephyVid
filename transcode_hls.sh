#!/usr/bin/env bash

# Usage: ./transcode_hls.sh input.mp4 output_dir

input_file="$1"
output_dir="$2"

# 1) Déterminer la résolution d’entrée
resolution=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
                     -of csv=p=0 "$input_file")
width=$(echo "$resolution" | cut -d',' -f1)
height=$(echo "$resolution" | cut -d',' -f2)

# Détecter FPS (pour distinguer 30fps vs 60fps par exemple)
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate \
              -of csv=p=0 "$input_file" | bc)

# (Facultatif) Détecter si HDR
hdr=$(ffprobe -v error -select_streams v:0 -show_entries stream=bits_per_raw_sample \
              -of csv=p=0 "$input_file")
is_hdr=false
[[ "$hdr" == "10" || "$hdr" == "12" ]] && is_hdr=true

# 2) Choisir dynamiquement les résolutions à générer
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

# 3) Pour l'exemple, définissons quelques bitrates en dur
#    (à adapter à tes besoins : HDR, FPS, etc.)
declare -A video_bitrates=(
  [2160]="16000k"
  [1440]="8000k"
  [1080]="4000k"
  [720]="2000k"
  [480]="1000k"
  [360]="800k"
  [240]="600k"
  [144]="400k"
)

declare -A audio_bitrates=(
  [2160]="192k"
  [1440]="192k"
  [1080]="128k"
  [720]="128k"
  [480]="96k"
  [360]="96k"
  [240]="64k"
  [144]="64k"
)

# 4) Générer la chaîne filter_complex : split + scale
#    Exemple : "split=4[v0][v1][v2][v3];[v0]scale=-2:1080[v0out];[v1]scale=-2:720[v1out];..."
num_res=${#resolutions[@]}
filter_complex="[0:v]split=${num_res}"
for i in "${!resolutions[@]}"; do
  filter_complex+="[v$i]"
done

for i in "${!resolutions[@]}"; do
  res="${resolutions[$i]}"
  filter_complex+=";[v$i]scale=-2:${res}[v${i}out]"
done

echo "filter_complex = $filter_complex"

# 5) Générer les blocs -map et préparer la var_stream_map
#    var_stream_map : "v:0,a:0 v:1,a:1 v:2,a:2..."
var_stream_map=""
map_args=""
video_codec="hevc_videotoolbox"  # Ou "libx265" ou autre

for i in "${!resolutions[@]}"; do
  res="${resolutions[$i]}"
  vid_bitrate="${video_bitrates[$res]}"
  aud_bitrate="${audio_bitrates[$res]}"

  # Bloc -map pour la i-ème résolution
  # -map [v{i}out] => -c:v:{i} ...
  # -map a:0 => -c:a:{i} ...
  map_args+=" -map [v${i}out] -c:v:${i} ${video_codec} -b:v:${i} ${vid_bitrate}"
  map_args+=" -map a:0 -c:a:${i} aac -b:a:${i} ${aud_bitrate}"

  # Alimentation de var_stream_map (index v:i,a:i)
  var_stream_map+="v:${i},a:${i} "
done

# Retirer l'espace finale dans var_stream_map
var_stream_map=$(echo "$var_stream_map" | xargs)

# 6) Construire la commande finale
#    -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 ..."
#    -master_pl_name master.m3u8
#    -hls_segment_filename "output_dir/%v/%03d.m4s"
#    "output_dir/%v/index.m3u8"
#
#    => %v sera l’index du flux (0,1,2...), FFmpeg génère tout pour chaque flux.
mkdir -p "$output_dir"

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

# 7) Afficher la commande pour vérification
echo "========================================"
echo "Commande FFmpeg générée :"
echo "$cmd"
echo "========================================"

# 8) Exécuter la commande
eval "$cmd"

echo "Transcodage multi-résolutions terminé !"
