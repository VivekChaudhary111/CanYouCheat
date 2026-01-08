import os
import uuid
import whisper
import torch
import soundfile as sf
from silero_vad import get_speech_timestamps, load_silero_vad
import torchaudio.transforms as T  # <-- Import for resampling
import logging

# --- Setup ---
# Configure logging
logging.basicConfig(level=logging.INFO)

# --- 1. Load models ONCE, globally ---
# This is crucial for performance.
try:
    VAD_MODEL = load_silero_vad()
    logging.info("Silero VAD model loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load Silero VAD model: {e}")
    VAD_MODEL = None

try:
    WHISPER_MODEL = whisper.load_model("base")
    logging.info("Whisper 'base' model loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load Whisper model: {e}")
    WHISPER_MODEL = None

# Define constants
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)
VAD_SAMPLING_RATE = 16000  # Silero VAD requires 16kHz (or 8kHz)

def analyze_audio_chunk(audio_bytes: bytes) -> dict:
    """
    Analyzes a chunk of audio bytes for speech, transcribes it,
    and checks for suspicious keywords.
    """
    # Check if models were loaded successfully
    if not VAD_MODEL or not WHISPER_MODEL:
        logging.error("Models are not loaded. Cannot analyze audio.")
        return {"suspicious": False, "transcript": "Error: Models not loaded."}

    audio_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.wav")

    try:
        # --- 2. Save temp file ---
        # We assume audio_bytes is a complete and valid WAV file
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        # --- 3. Load audio and pre-process for VAD ---
        try:
            wav, sr = sf.read(audio_path)
        except Exception as e:
            logging.error(f"Failed to read audio file {audio_path}: {e}")
            return {"suspicious": False, "transcript": "Error: Invalid audio file."}

        # Ensure audio is mono
        if wav.ndim > 1:
            wav = wav.mean(axis=1)

        # Convert to torch tensor, correct dtype (float32)
        wav_tensor = torch.from_numpy(wav).to(torch.float32)

        # --- 4. Resample for VAD if necessary ---
        if sr != VAD_SAMPLING_RATE:
            try:
                # Create a resampler
                resampler = T.Resample(orig_freq=sr, new_freq=VAD_SAMPLING_RATE)
                vad_wav_tensor = resampler(wav_tensor)
            except Exception as e:
                logging.error(f"Failed to resample audio: {e}")
                return {"suspicious": False, "transcript": "Error: Resampling failed."}
        else:
            vad_wav_tensor = wav_tensor

        # --- 5. Run VAD ---
        # Note: We pass the 1D tensor, NOT the unsqueezed one
        speech_timestamps = get_speech_timestamps(
            vad_wav_tensor, VAD_MODEL, sampling_rate=VAD_SAMPLING_RATE
        )

        if not speech_timestamps:
            logging.info("No speech detected.")
            return {"suspicious": False, "transcript": ""}

        # --- 6. Run Transcription ---
        # We can pass the original file path to Whisper;
        # it handles its own resampling internally.
        result = WHISPER_MODEL.transcribe(audio_path)
        transcript = result["text"]

        # --- 7. Suspicious detection ---
        suspicious_keywords = ["help me", "search online", "check question"]
        suspicious = any(kw in transcript.lower() for kw in suspicious_keywords)

        return {
            "suspicious": suspicious,
            "transcript": transcript
        }

    except Exception as e:
        # Catch any other unexpected errors
        logging.error(f"Error during audio analysis: {e}")
        return {"suspicious": False, "transcript": f"Error: {e}"}

    finally:
        # --- 8. Cleanup ---
        # This `finally` block ensures the file is
        # removed whether the function succeeds or fails.
        if os.path.exists(audio_path):
            os.remove(audio_path)