# audio.py — stub for wav2vec + gpt-oss-120b

def speech_to_text(audio_path: str) -> str:
    """
    Given an audio file path, return transcribed text using wav2vec.
    Replace this stub with actual model inference.
    """
    # TODO: integrate wav2vec model here
    print(f"[DEBUG] speech_to_text processing {audio_path}")
    return "This is a mocked transcript from wav2vec."

def analyze_truthfulness(transcript: str) -> float:
    """
    Given a transcript, run GPT-OSS-120B to estimate truthfulness score (0-1).
    Replace this stub with actual model call.
    """
    # TODO: integrate GPT-OSS-120B inference here
    print(f"[DEBUG] analyze_truthfulness processing transcript: {transcript}")
    return 0.87
