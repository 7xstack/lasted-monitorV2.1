/**
 * Google Text-to-Speech API Integration
 * ใช้สำหรับแปลงข้อความเป็นเสียงพูด
 */

export interface TTSOptions {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  minDurationSec?: number;
  onReady?: () => void;
  onLog?: (message: string) => void;
  isMale?: boolean;
  gender?: "MALE" | "FEMALE" | "NEUTRAL";
  voiceCandidates?: string[];
}

export interface GoogleTTSResponse {
  audioContent: string;
  audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch: number;
  };
}

/**
 * ฟังก์ชันสำหรับเรียกใช้ Google TTS API
 */
export async function synthesizeText(options: TTSOptions): Promise<string | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY;
    
    if (!apiKey) {
      console.error('Google TTS API key not found');
      return null;
    }

    // กำหนด ssmlGender: ถ้ามี gender ให้ใช้, ถ้า voice เป็น Neural2-C ให้ใช้ FEMALE, ไม่งั้นใช้ isMale
    let ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL' = 'NEUTRAL';
    if (options.gender) {
      ssmlGender = options.gender;
    } else if (options.voice === 'th-TH-Neural2-C') {
      ssmlGender = 'FEMALE';
    } else if (options.isMale !== undefined) {
      ssmlGender = options.isMale ? 'MALE' : 'FEMALE';
    }

    const requestBody = {
      input: { text: options.text },
      voice: {
        languageCode: options.language || 'th-TH',
        ssmlGender: ssmlGender,
        // ไม่ใส่ name เพื่อให้ API เลือก voice ที่เหมาะสมตาม ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        // ไม่ใส่ pitch, speakingRate, volumeGainDb เพื่อให้เหมือนกับโปรเจคที่ทำงานได้
      }
    };

    // Debug: log request body เพื่อตรวจสอบ
    console.log('🔊 Google TTS Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google TTS API error:', errorData);
      return null;
    }

    const data: GoogleTTSResponse = await response.json();
    return data.audioContent;
  } catch (error) {
    console.error('Error calling Google TTS API:', error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับเล่นเสียงจาก base64 audio data
 */
interface PlayAudioOptions {
  minDurationSec?: number;
  onReady?: () => void;
  onLog?: (message: string) => void;
}

export function playAudioFromBase64(
  base64Audio: string,
  options?: PlayAudioOptions
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // แปลง base64 เป็น blob
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        const minDuration = options?.minDurationSec ?? 0.3;
        if (Number.isFinite(duration) && duration < minDuration) {
          options?.onLog?.(
            `Audio duration ${duration.toFixed(2)}s shorter than minimum ${minDuration}s`
          );
          audio.pause();
          URL.revokeObjectURL(audioUrl);
          reject(new Error("Audio duration too short"));
          return;
        }
        options?.onLog?.(
          `Audio metadata loaded, duration ${Number.isFinite(duration) ? duration.toFixed(2) : "unknown"}s`
        );
        options?.onReady?.();
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch((error) => {
            URL.revokeObjectURL(audioUrl);
            reject(error);
          });
        }
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error instanceof Error ? error : new Error("Audio playback error"));
      };
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Unknown audio error"));
    }
  });
}

/**
 * ฟังก์ชันหลักสำหรับเล่นเสียง TTS
 */
export async function playGoogleTTS(options: TTSOptions): Promise<boolean> {
  try {
    options.onLog?.("Requesting Google TTS synthesis");

    const tried = new Set<string>();
    const candidates: string[] = [];
    if (options.voice) candidates.push(options.voice);
    if (options.voiceCandidates) {
      for (const candidate of options.voiceCandidates) {
        if (candidate && !candidates.includes(candidate)) {
          candidates.push(candidate);
        }
      }
    }

    let audioBase64: string | null = null;

    for (const candidate of candidates) {
      if (!candidate || tried.has(candidate)) continue;
      tried.add(candidate);
      options.onLog?.(`Trying voice candidate: ${candidate}`);
      audioBase64 = await synthesizeText({
        ...options,
        voice: candidate,
      });
      if (audioBase64) {
        options.onLog?.(`Voice candidate succeeded: ${candidate}`);
        break;
      } else {
        options.onLog?.(`Voice candidate failed: ${candidate}`);
      }
    }

    if (!audioBase64) {
      options.onLog?.("Falling back to default voice selection");
      audioBase64 = await synthesizeText({
        ...options,
        voice: undefined,
      });
    }
    
    if (audioBase64) {
      const approximateBytes = Math.ceil((audioBase64.length * 3) / 4);
      options.onLog?.(`Received audio payload ~${approximateBytes} bytes`);
      if (approximateBytes < 1000) {
        options.onLog?.("Audio payload too small, aborting playback");
        return false;
      }
      await playAudioFromBase64(audioBase64, {
        minDurationSec: options.minDurationSec,
        onReady: options.onReady,
        onLog: options.onLog,
      });
      options.onLog?.("Audio playback completed");
      return true;
    }
    options.onLog?.("Failed to synthesize text");
    return false;
  } catch (error) {
    options.onLog?.(
      `Error playing Google TTS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
}

/**
 * รายการเสียง Google TTS ที่รองรับภาษาไทย
 */
export const THAI_VOICES = {
  STANDARD_A: 'th-TH-Standard-A', // เสียงผู้ชาย
  STANDARD_B: 'th-TH-Standard-B', // เสียงผู้หญิง
  STANDARD_C: 'th-TH-Standard-C', // เสียงผู้ชาย (สำเนียงต่าง)
  STANDARD_D: 'th-TH-Standard-D', // เสียงผู้หญิง (สำเนียงต่าง)
  NEURAL2_C: 'th-TH-Neural2-C',  // เสียง Neural ผู้หญิง
  NEURAL_A: 'th-TH-Standard-A',    // ใช้ Standard-A แทน
  NEURAL_B: 'th-TH-Standard-B',    // ใช้ Standard-B แทน
  NEURAL_C: 'th-TH-Standard-C',    // ใช้ Standard-C แทน
  NEURAL_D: 'th-TH-Standard-D'     // ใช้ Standard-D แทน
} as const;
