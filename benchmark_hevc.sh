#!/usr/bin/env bash
#
# benchmark_hevc.sh
#
# Compare deux solutions d'encodage (CRF vs 2-pass) en HEVC,
# chacun testé avec hevc_videotoolbox et libx265.
#
# Usage: ./benchmark_hevc.sh input.mp4

########################
# 0) Vérification input
########################

if [ $# -lt 1 ]; then
  echo "Usage: $0 <input_file>"
  exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Erreur : Fichier d'entrée introuvable !"
  exit 1
fi

# Nom de base sans extension (pour nommer les sorties)
BASENAME=$(basename "$INPUT_FILE" | sed 's/\.[^.]*$//')

# Répertoire de sortie
OUTPUT_DIR="./benchmark_output"
mkdir -p "$OUTPUT_DIR"

# Log détaillé
LOG_FILE="$OUTPUT_DIR/benchmark_$(date +%Y%m%d_%H%M%S).log"


########################################
# 1) Fonction pour mesurer l'encodage
########################################
#  - $1 = commande ffmpeg à exécuter
#  - $2 = label (ex: "CRF HW")
#  - $3 = nom du fichier de sortie
#  - $4 = 1 ou 0 -> calculer PSNR/SSIM ou non
measure_encode() {
  local cmd="$1"
  local label="$2"
  local outfile="$3"
  local do_metrics="$4"

  echo "" | tee -a "$LOG_FILE"
  echo "====================================================" | tee -a "$LOG_FILE"
  echo "[Début encodage] $label" | tee -a "$LOG_FILE"
  echo "Commande : $cmd" | tee -a "$LOG_FILE"

  local start_time=$(date +%s)
  # Exécuter l'encodage
  eval "$cmd" 2>&1 | tee -a "$LOG_FILE"
  local end_time=$(date +%s)
  local duration=$(( end_time - start_time ))

  echo "[Fin encodage] $label : durée = ${duration}s" | tee -a "$LOG_FILE"

  # Taille du fichier encodé
  if [ -f "$outfile" ]; then
    local size_bytes=$(stat -c %s "$outfile" 2>/dev/null || stat -f %z "$outfile" 2>/dev/null)
    local size_mb=$(awk "BEGIN {printf \"%.2f\", $size_bytes/1048576}")
    echo "[Taille fichier] $label : ${size_mb} MB" | tee -a "$LOG_FILE"
  else
    echo "[Taille fichier] $label : Fichier introuvable !" | tee -a "$LOG_FILE"
  fi

  # (Optionnel) Calcul PSNR / SSIM
  if [ "$do_metrics" -eq 1 ] && [ -f "$outfile" ]; then
    echo "[Qualité] Calcul PSNR/SSIM pour $label..." | tee -a "$LOG_FILE"
    ffmpeg -i "$INPUT_FILE" -i "$outfile" \
           -lavfi "[0:v][1:v]ssim;[0:v][1:v]psnr" \
           -f null - 2>&1 | tee -a "$LOG_FILE"
  fi
}


############################################################################
# 2) Encodage CRF (solution A)
#    - A1 : hevc_videotoolbox
#    - A2 : libx265
############################################################################

# A1) CRF ~ "qualité" hardware (videotoolbox).
# Il n'existe pas de CRF pur pour videotoolbox, on utilise -b:v 0 + -quality
OUTPUT_HW_CRF="$OUTPUT_DIR/${BASENAME}_hw_crf.mp4"
CMD_HW_CRF="ffmpeg -hide_banner -y \
  -i \"$INPUT_FILE\" \
  -c:v hevc_videotoolbox \
    -b:v 0 \
    -quality 1 \
  -c:a aac \
    -b:a 128k \
  \"$OUTPUT_HW_CRF\""

measure_encode "$CMD_HW_CRF" "CRF HW (videotoolbox)" "$OUTPUT_HW_CRF" 1


# A2) CRF logiciel (libx265)
OUTPUT_SW_CRF="$OUTPUT_DIR/${BASENAME}_sw_crf.mp4"
CMD_SW_CRF="ffmpeg -hide_banner -y \
  -i \"$INPUT_FILE\" \
  -c:v libx265 \
    -preset slow \
    -crf 26 \
  -c:a aac \
    -b:a 128k \
  \"$OUTPUT_SW_CRF\""

measure_encode "$CMD_SW_CRF" "CRF SW (libx265)" "$OUTPUT_SW_CRF" 1


############################################################################
# 3) Encodage 2-pass (solution B)
#    - B1 : hevc_videotoolbox (si supporté)
#    - B2 : libx265
############################################################################

# B1) 2-pass hardware (videotoolbox) - non garanti selon FFmpeg/macOS
# Ex : cible ~ 3000k, maxrate 4000k
OUTPUT_HW_2PASS="$OUTPUT_DIR/${BASENAME}_hw_2pass.mp4"

CMD_HW_2PASS_PASS1="ffmpeg -hide_banner -y \
  -i \"$INPUT_FILE\" \
  -c:v hevc_videotoolbox \
    -b:v 3000k \
    -maxrate 4000k \
    -bufsize 8000k \
    -pass 1 \
  -an \
  -f null /dev/null"

CMD_HW_2PASS_PASS2="ffmpeg -hide_banner -y \
  -i \"$INPUT_FILE\" \
  -c:v hevc_videotoolbox \
    -b:v 3000k \
    -maxrate 4000k \
    -bufsize 8000k \
    -pass 2 \
  -c:a aac \
    -b:a 128k \
  \"$OUTPUT_HW_2PASS\""

echo "" | tee -a "$LOG_FILE"
echo "====================================================" | tee -a "$LOG_FILE"
echo "[Début encodage] 2-pass HW (videotoolbox), PASS 1" | tee -a "$LOG_FILE"
eval "$CMD_HW_2PASS_PASS1" 2>&1 | tee -a "$LOG_FILE"
echo "[Fin encodage] 2-pass HW PASS 1" | tee -a "$LOG_FILE"

measure_encode "$CMD_HW_2PASS_PASS2" "2-pass HW (videotoolbox) PASS 2" "$OUTPUT_HW_2PASS" 1


# B2) 2-pass logiciel (libx265)
OUTPUT_SW_2PASS="$OUTPUT_DIR/${BASENAME}_sw_2pass.mp4"

CMD_SW_2PASS_PASS1="ffmpeg -hide_banner -y \
  -i \"$INPUT_FILE\" \
  -c:v libx265 \
    -preset slow \
    -b:v 2500k \
    -pass 1 \
    -x265-params \"pass=1\" \
  -an \
  -f null /dev/null"

CMD_SW_2PASS_PASS2="ffmpeg -hide_banner -y \
  -i \"$INPUT_FILE\" \
  -c:v libx265 \
    -preset slow \
    -b:v 2500k \
    -pass 2 \
    -x265-params \"pass=2\" \
  -c:a aac \
    -b:a 128k \
  \"$OUTPUT_SW_2PASS\""

echo "" | tee -a "$LOG_FILE"
echo "====================================================" | tee -a "$LOG_FILE"
echo "[Début encodage] 2-pass SW (libx265), PASS 1" | tee -a "$LOG_FILE"
eval "$CMD_SW_2PASS_PASS1" 2>&1 | tee -a "$LOG_FILE"
echo "[Fin encodage] 2-pass SW PASS 1" | tee -a "$LOG_FILE"

measure_encode "$CMD_SW_2PASS_PASS2" "2-pass SW (libx265) PASS 2" "$OUTPUT_SW_2PASS" 1


##################################
# 4) Fin du script
##################################
echo "" | tee -a "$LOG_FILE"
echo "====================================================" | tee -a "$LOG_FILE"
echo "Benchmark terminé. Logs disponibles dans : $LOG_FILE" | tee -a "$LOG_FILE"
