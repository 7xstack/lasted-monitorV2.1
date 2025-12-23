const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = 2000;
const AUDIO_DIR = path.join(__dirname, 'audio');
const AUDIO_SAVE_DIR = path.join(AUDIO_DIR, 'male');
const AUDIO_FEMALE_DIR = path.join(AUDIO_DIR, 'female');
const AUDIO_CACHE_DIR = path.join(AUDIO_DIR, 'cache');
const AUDIO_CACHE_MALE_DIR = path.join(AUDIO_CACHE_DIR, 'male');
const AUDIO_CACHE_FEMALE_DIR = path.join(AUDIO_CACHE_DIR, 'female');
const AUDIO_PATIENTS_DIR = path.join(AUDIO_DIR, 'patients');
const AUDIO_PATIENTS_MALE_DIR = path.join(AUDIO_PATIENTS_DIR, 'male');
const AUDIO_PATIENTS_FEMALE_DIR = path.join(AUDIO_PATIENTS_DIR, 'female');
const AUDIO_TEMP_DIR = path.join(AUDIO_DIR, 'temp'); // เก็บไฟล์รวมชั่วคราว
const TEMP_TTL_MS = Number(process.env.TEMP_TTL_MS || 2 * 60 * 1000); // ลบหลัง ~2 นาที (ค่าเริ่มต้น)
const PUBLIC_DIR = path.join(__dirname, 'public');

// Minimal OpenAPI spec for Swagger UI
const swaggerSpec = {
	openapi: '3.0.0',
	info: {
		title: 'โรงพยาบาล TTS API',
		version: '1.0.0',
		description: 'API สำหรับระบบเรียกคิวและเตรียมไฟล์เสียงผู้ป่วย'
	},
	servers: [
		{
			url: 'http://localhost:2000',
			description: 'Production server'
		}
	],
	components: {
		securitySchemes: {
			TokenAuth: {
				type: 'apiKey',
				in: 'header',
				name: 'x-google-api-key',
				description: 'Token สำหรับเรียก Google TTS'
			}
		}
	},
	security: [
		{
			TokenAuth: []
		}
	],
	paths: {
		'/visit-queue-files': {
			post: {
				summary: 'สร้างและรวมไฟล์เสียงสำหรับคิว',
				description: 'รับ visit_queue_no, HN และข้อมูลอื่น ๆ เพื่อรวมไฟล์เสียงเป็นไฟล์เดียว',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									visit_queue_no: { type: 'string', example: 'A001' },
									style_voice: { type: 'integer', enum: [1, 2], default: 1, description: '1=ผู้ชาย, 2=ผู้หญิง' },
									HN: { type: 'string', example: '12345' },
									description: { type: 'string', example: 'กรุณา' },
									name: { type: 'string', example: 'สมชาย' },
									pname: { type: 'integer', enum: [1, 2, 3, 4, 5], description: '1=นาย, 2=นาง, 3=นางสาว, 4=เด็กชาย, 5=เด็กหญิง' },
									surname: { type: 'string', example: 'ใจดี' },
									station: { type: 'string', example: 'ห้องตรวจ 1' },
									notice_text: { type: 'string', example: 'กรุณารอเรียกคิวถัดไป' },
									type: { type: 'string', example: 'er', description: 'ใช้ปรับข้อความของ station สำหรับ ER ถ้ามี' }
								},
								required: ['visit_queue_no']
							}
						}
					}
				},
				responses: {
					'200': {
						description: 'รวมไฟล์เสียงสำเร็จ',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										visit_queue_no: { type: 'string' },
										style_voice: { type: 'integer' },
										HN: { type: 'string', nullable: true },
										merged_file: { type: 'string', example: '/audio/temp/HN12345.mp3' },
										cached: { type: 'boolean', description: 'true ถ้าใช้ไฟล์ที่มีอยู่แล้ว' },
										ttl_ms: { type: 'integer' }
									}
								}
							}
						}
					},
					'400': { description: 'ข้อมูลไม่ครบหรือไม่ถูกต้อง' },
					'404': { description: 'ไม่พบไฟล์พื้นฐานที่ต้องใช้' },
					'500': { description: 'ผิดพลาดขณะรวมไฟล์เสียง' }
				}
			}
		},
		'/generate-patient-audio': {
			post: {
				summary: 'เตรียมไฟล์เสียงผู้ป่วยตาม HN',
				description: 'รับรายชื่อผู้ป่วย (HN และ name) แล้วสร้างไฟล์เสียงทั้งผู้ชายและผู้หญิงเก็บไว้ในโฟลเดอร์ patients',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									patients: {
										type: 'array',
										items: {
											type: 'object',
											properties: {
												HN: { type: 'string', example: '12345' },
												name: { type: 'string', example: 'สมชาย ใจดี' }
											},
											required: ['HN', 'name']
										}
									}
								},
								required: ['patients']
							}
						}
					}
				},
				responses: {
					'200': {
						description: 'สร้างไฟล์เสียงผู้ป่วยสำเร็จ',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										ok: { type: 'boolean' },
										total: { type: 'integer' },
										success: { type: 'integer' },
										failed: { type: 'integer' },
										items: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													HN: { type: 'string' },
													name: { type: 'string' },
													style_voice: { type: 'integer' },
													file: { type: 'string', example: '/audio/patients/male/HN12345.mp3' },
													cached: { type: 'boolean' },
													error: { type: 'string', nullable: true }
												}
											}
										}
									}
								}
							}
						}
					},
					'400': { description: 'ข้อมูลไม่ครบหรือไม่ถูกต้อง' },
					'500': { description: 'ผิดพลาดขณะสร้างไฟล์เสียงผู้ป่วย' }
				}
			}
		}
	}
};

// minimal CORS for browser usage
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-google-api-key, authorization');
	if (req.method === 'OPTIONS') return res.sendStatus(200);
	next();
});

app.use(express.json({ limit: '1mb' }));

// Swagger UI พร้อม custom JS สำหรับบังคับกรอกและตรวจ Token
app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		customJs: path.join(PUBLIC_DIR, 'swagger-custom.js')
	})
);
app.get('/swagger.json', (req, res) => {
	res.json(swaggerSpec);
});

// ensure audio dir exists
if (!fs.existsSync(AUDIO_DIR)) {
	fs.mkdirSync(AUDIO_DIR, { recursive: true });
}
// ensure subdir audio/male exists
if (!fs.existsSync(AUDIO_SAVE_DIR)) {
	fs.mkdirSync(AUDIO_SAVE_DIR, { recursive: true });
}
// ensure subdir audio/female exists
if (!fs.existsSync(AUDIO_FEMALE_DIR)) {
	fs.mkdirSync(AUDIO_FEMALE_DIR, { recursive: true });
}
// ensure subdir audio/cache exists
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
	fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_CACHE_MALE_DIR)) {
	fs.mkdirSync(AUDIO_CACHE_MALE_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_CACHE_FEMALE_DIR)) {
	fs.mkdirSync(AUDIO_CACHE_FEMALE_DIR, { recursive: true });
}
// ensure subdir audio/patients exists
if (!fs.existsSync(AUDIO_PATIENTS_DIR)) {
	fs.mkdirSync(AUDIO_PATIENTS_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_PATIENTS_MALE_DIR)) {
	fs.mkdirSync(AUDIO_PATIENTS_MALE_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_PATIENTS_FEMALE_DIR)) {
	fs.mkdirSync(AUDIO_PATIENTS_FEMALE_DIR, { recursive: true });
}
// ensure subdir audio/temp exists
if (!fs.existsSync(AUDIO_TEMP_DIR)) {
	fs.mkdirSync(AUDIO_TEMP_DIR, { recursive: true });
}

// ล้างไฟล์ temp ที่หมดอายุ
function sweepTempDirectory() {
	try {
		const now = Date.now();
		for (const name of fs.readdirSync(AUDIO_TEMP_DIR)) {
			const full = path.join(AUDIO_TEMP_DIR, name);
			try {
				const stat = fs.statSync(full);
				if (stat.isFile() && now - stat.mtimeMs > TEMP_TTL_MS) {
					fs.unlinkSync(full);
				}
			} catch (_) {}
		}
	} catch (_) {}
}
// เรียกทุก ๆ 60 วินาที และตอนเริ่มต้น
setInterval(sweepTempDirectory, 60 * 1000).unref?.();
sweepTempDirectory();

// รวมไฟล์ MP3 เป็นไฟล์เดียวด้วย ffmpeg
function mergeMp3FilesWithFfmpeg(inputPaths, outputPath) {
	return new Promise((resolve, reject) => {
		if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
			return reject(new Error('ไม่มีไฟล์สำหรับรวม'));
		}
		// สร้างไฟล์รายการสำหรับ concat demuxer
		const listFile = path.join(AUDIO_TEMP_DIR, `concat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`);
		const lines = inputPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
		fs.writeFileSync(listFile, lines, 'utf8');
		const run = (args) => new Promise((res, rej) => {
			const child = execFile('ffmpeg', args, { windowsHide: true }, (err) => {
				if (err) return rej(err);
				res();
			});
			child.stderr?.on('data', () => {});
			child.stdout?.on('data', () => {});
		});
		(async () => {
			try {
				// 1) ลอง concat แบบ stream copy (เร็วมาก) ถ้าพารามิเตอร์ไฟล์ต่างกันจะล้มเหลว
				await run([
					'-hide_banner', '-loglevel', 'error',
					'-f', 'concat', '-safe', '0',
					'-i', listFile,
					'-vn', '-sn',
					'-c', 'copy',
					'-y', outputPath
				]);
			} catch (e) {
				try {
					// 2) Fallback: re-encode ให้รูปแบบสอดคล้องกัน (ช้ากว่าแต่ชัวร์)
					await run([
						'-hide_banner', '-loglevel', 'error',
						'-f', 'concat', '-safe', '0',
						'-i', listFile,
						'-vn', '-sn',
						'-c:a', 'libmp3lame',
						'-b:a', '160k',
						'-ar', '24000',
						'-y', outputPath
					]);
				} catch (e2) {
					try { fs.unlinkSync(listFile); } catch (_) {}
					return reject(e2);
				}
			}
			try { fs.unlinkSync(listFile); } catch (_) {}
			resolve();
		})().catch(err => {
			try { fs.unlinkSync(listFile); } catch (_) {}
			reject(err);
		});
	});
}

// สังเคราะห์เสียงเป็น buffer ตาม style voice (REST ด้วย API Key หรือ Client Library)
async function synthesizeBufferDynamic(inputText, styleVoice, speakingRate, maybeApiKey) {
	let audioBuffer;
	if (maybeApiKey) {
		audioBuffer = await synthesizeWithApiKey(inputText, maybeApiKey, styleVoice, speakingRate);
	} else {
		const voiceCandidates = Number(styleVoice) === 2
			? [
				{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
				{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
				{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
				{ languageCode: 'th-TH' }
			]
			: [
				{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
				{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
				{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
				{ languageCode: 'th-TH', ssmlGender: 'MALE' },
				{ languageCode: 'th-TH' }
			];
		let lastErr = null;
		for (const voice of voiceCandidates) {
			try {
				const request = { input: { text: inputText }, voice, audioConfig: { audioEncoding: 'MP3', speakingRate } };
				const [response] = await ttsClient.synthesizeSpeech(request);
				audioBuffer = Buffer.isBuffer(response.audioContent) ? response.audioContent : Buffer.from(response.audioContent, 'base64');
				break;
			} catch (e) {
				lastErr = e;
				continue;
			}
		}
		if (!audioBuffer) {
			throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงได้');
		}
	}
	return audioBuffer;
}

// สังเคราะห์เสียงเป็นไฟล์ชั่วคราวใน audio/temp แล้วคืน path
async function synthesizeToTempFile(inputText, styleVoice, speakingRate, maybeApiKey) {
	const buf = await synthesizeBufferDynamic(inputText, styleVoice, speakingRate, maybeApiKey);
	const outBase = `part_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
	const outPath = path.join(AUDIO_TEMP_DIR, outBase);
	fs.writeFileSync(outPath, buf);
	return outPath;
}

function ensureKhunPrefix(nameRaw) {
	const s = String(nameRaw || '').trim();
	if (!s) return s;
	// ถ้าไม่ได้ขึ้นต้นด้วย "คุณ" ให้เติม
	if (!/^คุณ\b/u.test(s)) {
		return `คุณ ${s}`;
	}
	return s;
}

// audio index page with back button
app.get('/audio', (req, res) => {
	try {
		const files = fs.readdirSync(AUDIO_SAVE_DIR)
			.filter(n => n.toLowerCase().endsWith('.mp3'))
			.sort((a, b) => a.localeCompare(b, 'th'));
		const listItems = files.map(n => {
			const enc = encodeURIComponent(n);
			return `<li><a href="/audio/male/${enc}">${n}</a></li>`;
		}).join('');
		const html = `
<!DOCTYPE html>
<html lang="th">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>ไฟล์เสียง | โรงพยาบาล</title>
	<style>
		body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;margin:0;background:#f7f7f8;color:#111}
		.container{max-width:720px;margin:32px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 2px 24px rgba(0,0,0,.06)}
		h1{margin:0 0 16px 0;font-size:22px}
		a.btn{display:inline-block;background:#111;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none}
		ul{padding-left:18px}
		li{margin:6px 0}
	</style>
	</head>
<body>
	<div class="container">
		<h1>ไฟล์เสียงที่สร้างไว้</h1>
		<p><a class="btn" href="/">← กลับไปหน้าสร้างคำ</a></p>
		${files.length ? `<ul>${listItems}</ul>` : `<p>ยังไม่มีไฟล์เสียง</p>`}
	</div>
</body>
</html>`;
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.send(html);
	} catch (e) {
		res.status(500).send('ไม่สามารถอ่านรายการไฟล์ได้');
	}
});

// simple player wrapper so user always has a back button
app.get('/player', (req, res) => {
	const file = req.query.file;
	if (!file || !String(file).startsWith('/audio/')) {
		return res.status(400).send('ต้องระบุพารามิเตอร์ file ที่ขึ้นต้นด้วย /audio/');
	}
	const src = String(file);
	const html = `
<!DOCTYPE html>
<html lang="th">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>เล่นเสียง | โรงพยาบาล</title>
	<style>
		body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;margin:0;background:#f7f7f8;color:#111}
		.container{max-width:720px;margin:48px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 2px 24px rgba(0,0,0,.06);text-align:center}
		a.btn{display:inline-block;background:#111;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;margin:8px}
		audio{width:100%;margin-top:16px}
	</style>
	</head>
<body>
	<div class="container">
		<h1>เล่นเสียง</h1>
		<audio controls autoplay src="${src}"></audio>
		<div>
			<a class="btn" href="#" id="replayBtn">เล่นอีกครั้ง</a>
			<a class="btn" href="/">← กลับไปหน้าสร้างคำ</a>
			<a class="btn" href="${src}" download>ดาวน์โหลดไฟล์</a>
			<a class="btn" href="/audio">ดูรายการไฟล์</a>
		</div>
	</div>
	<script>
		(function(){
			const audio = document.querySelector('audio');
			const replay = document.getElementById('replayBtn');
			replay?.addEventListener('click', function(e){
				e.preventDefault();
				try {
					audio.currentTime = 0;
					audio.play().catch(()=>{});
				} catch (_) {}
			});
		})();
	</script>
</body>
</html>`;
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.send(html);
});

// queue player - สร้างเพลย์ลิสต์จาก visit_queue_no แล้วเล่นต่อเนื่อง
app.get('/queue-player', (req, res) => {
	const vq = req.query.visit_queue_no;
	const styleVoiceRaw = req.query.style_voice;
	const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1; // 1=male (default), 2=female
	const subdir = styleVoice === 2 ? 'female' : 'male';
	const descriptionInput = req.query.description && String(req.query.description).trim() ? String(req.query.description).trim() : null;
	const nameInput = req.query.name && String(req.query.name).trim() ? String(req.query.name).trim() : null;
	const surnameInput = req.query.surname && String(req.query.surname).trim() ? String(req.query.surname).trim() : null;
	const stationInput = req.query.station && String(req.query.station).trim() ? String(req.query.station).trim() : null;
	const noticeInput = req.query.notice_text && String(req.query.notice_text).trim() ? String(req.query.notice_text).trim() : null;
	if (!vq || !String(vq).trim()) {
		return res.status(400).send('ต้องระบุ visit_queue_no ใน query เช่น /queue-player?visit_queue_no=A001');
	}
	// base queue files
	let files = buildQueueFiles(vq);
	// optional: description will be appended after surname
	let safeDescription = null;
	let cacheDescriptionUrlPrefix = null;
	// optional: insert name after queue before suffix
	let safeName = null;
	let cacheUrlPrefix = null;
	if (nameInput) {
		safeName = normalizeNameForFilename(nameInput);
		const nameFileName = `${safeName}.mp3`;
		cacheUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		// insert before suffix
		if (files[files.length - 1] === 'suffix.mp3') {
			files.splice(files.length - 1, 0, nameFileName);
		} else {
			files.push(nameFileName);
		}
	}
	// optional: insert surname right after name (or after queue if no name)
	let safeSurname = null;
	if (surnameInput) {
		safeSurname = normalizeNameForFilename(surnameInput);
		const surnameFileName = `${safeSurname}.mp3`;
		if (files[files.length - 1] === 'suffix.mp3') {
			files.splice(files.length - 1, 0, surnameFileName);
		} else {
			files.push(surnameFileName);
		}
	}
	// now insert description after surname (or after name if no surname)
	if (descriptionInput) {
		safeDescription = sanitizeFileName(descriptionInput);
		const descriptionFileName = `${safeDescription}.mp3`;
		cacheDescriptionUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		files.push(descriptionFileName);
	}
	// optional: insert station after name (if any) before suffix
	let safeStation = null;
	let cacheStationUrlPrefix = null;
	if (stationInput) {
		safeStation = normalizeStationForFilename(stationInput);
		const stationFileName = `${safeStation}.mp3`;
		cacheStationUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		if (files[files.length - 1] === 'suffix.mp3') {
			files.splice(files.length - 1, 0, stationFileName);
		} else {
			files.push(stationFileName);
		}
	}
	// optional: append notice text at the very end
	let safeNotice = null;
	let cacheNoticeUrlPrefix = null;
	if (noticeInput) {
		safeNotice = sanitizeFileName(noticeInput);
		const noticeFileName = `${safeNotice}.mp3`;
		cacheNoticeUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		files.push(noticeFileName);
	}
	// map to URLs respecting male/female dirs and cache for name/station
	const urls = files.map(name => {
		if (safeDescription && name === `${safeDescription}.mp3`) {
			return `${cacheDescriptionUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeName && name === `${safeName}.mp3`) {
			return `${cacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeSurname && name === `${safeSurname}.mp3`) {
			return `${cacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeStation && name === `${safeStation}.mp3`) {
			return `${cacheStationUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeNotice && name === `${safeNotice}.mp3`) {
			return `${cacheNoticeUrlPrefix}/${encodeURIComponent(name)}`;
		}
		return `/audio/${subdir}/${encodeURIComponent(name)}`;
	});
	const list = files.map(f => `<li>${f}</li>`).join('');
	const html = `
<!DOCTYPE html>
<html lang="th">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>เล่นเสียงตามคิว | ${vq}</title>
	<style>
		body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;margin:0;background:#f7f7f8;color:#111}
		.container{max-width:760px;margin:36px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 2px 24px rgba(0,0,0,.06)}
		h1{margin:0 0 8px 0;font-size:22px}
		ul{padding-left:20px}
		a.btn{display:inline-block;background:#111;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;margin:6px 6px 0 0}
		audio{width:100%;margin:14px 0}
		.note{color:#666;font-size:12px}
	</style>
</head>
<body>
	<div class="container">
		<h1>เล่นเสียงตามคิว: ${vq} (${styleVoice === 2 ? 'ผู้หญิง' : 'ผู้ชาย'})</h1>
		<div class="note">เพลย์ลิสต์จะเล่นอัตโนมัติทีละไฟล์จนจบ</div>
		<audio id="player" controls autoplay></audio>
		<div>
			<a class="btn" href="#" id="replayBtn">เล่นใหม่ตั้งแต่ต้น</a>
			<a class="btn" href="/visit.html">← กลับไปกรอกคิวใหม่</a>
			<a class="btn" href="/">ไปหน้า TTS</a>
			<a class="btn" href="/audio">ดูรายการไฟล์</a>
		</div>
		<h3>รายการไฟล์</h3>
		<ol>${list}</ol>
	</div>
	<script>
		const urls = ${JSON.stringify(urls)};
		let i = 0;
		const audio = document.getElementById('player');
		function playAt(idx){
			if(idx < 0 || idx >= urls.length) return;
			audio.src = urls[idx];
			audio.play().catch(()=>{});
		}
		audio.addEventListener('ended', () => {
			i += 1;
			if(i < urls.length) playAt(i);
		});
		// start
		playAt(0);
		// replay handler
		document.getElementById('replayBtn')?.addEventListener('click', function(e){
			e.preventDefault();
			i = 0;
			playAt(0);
		});
	</script>
</body>
</html>
`;
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.send(html);
});

// (removed) /voices endpoint

// serve frontend
app.use(express.static(PUBLIC_DIR));

// serve saved audio files
app.use('/audio', express.static(AUDIO_DIR));

// sanitize filename to avoid illegal path chars while keeping content readable
function sanitizeFileName(inputText) {
	const replaced = String(inputText).replace(/[\/\\:*?"<>|]+/g, '_').trim();
	return replaced.length ? replaced : 'tts';
}

// Convert pname (1-5) to prefix title
function getPrefixFromPname(pname) {
	const pnameNum = Number(pname);
	switch (pnameNum) {
		case 1: return 'นาย';
		case 2: return 'นาง';
		case 3: return 'นางสาว';
		case 4: return 'เด็กชาย';
		case 5: return 'เด็กหญิง';
		default: return 'คุณ';
	}
}

// Normalize name for filename: drop leading courtesy 'คุณ' and all spaces
function normalizeNameForFilename(nameInput) {
	const base = String(nameInput || '');
	// remove leading 'คุณ' (with optional spaces), then strip all whitespace
	const removedCourtesy = base.replace(/^\s*คุณ\s*/u, '');
	const noSpaces = removedCourtesy.replace(/\s+/g, '');
	return sanitizeFileName(noSpaces);
}

// Normalize station for filename: drop leading 'ที่' and all spaces
function normalizeStationForFilename(stationInput) {
	const base = String(stationInput || '');
	const removedPrefix = base.replace(/^\s*ที่\s*/u, '');
	const noSpaces = removedPrefix.replace(/\s+/g, '');
	return sanitizeFileName(noSpaces);
}

// Build ordered file list for a given visit_queue_no
function buildQueueFiles(visitQueueNo) {
	const raw = String(visitQueueNo || '').trim();
	const center = raw.toUpperCase().split('').filter(ch => /[A-Z0-9]/.test(ch));
	const files = ['prefix.mp3', ...center.map(ch => `${ch}.mp3`)];
	return files;
}

// แปลง VQ เช่น "A001" -> ข้อความสำหรับพูด "A 0 0 1"
function buildSpeakTextFromQueue(vq) {
	const raw = String(vq || '').trim().toUpperCase();
	const parts = raw.split('').filter(ch => /[A-Z0-9]/.test(ch));
	return parts.join(',');
}

// สร้างไฟล์เสียงใหม่ต่อคิว (ไม่ merge) เซฟชื่อไฟล์เป็น VQ.mp3 ในโฟลเดอร์ตามเพศ
async function synthesizeQueueToFile(vq, styleVoice, speakingRate, maybeApiKey, overwrite = false) {
	const vqNorm = String(vq || '').toUpperCase();
	// รองรับทั้งรูปแบบ ตัวอักษร 1 ตัว + เลข 3 ตัว (A001)
	// และตัวอักษร 2 ตัว + เลข 3 ตัว (QK009)
	if (!/^[A-Z]{1,2}[0-9]{3}$/.test(vqNorm)) {
		throw new Error(`รูปแบบ visit_queue_no ไม่ถูกต้อง: ${vqNorm}`);
	}
	const outDir = Number(styleVoice) === 2 ? AUDIO_FEMALE_DIR : AUDIO_SAVE_DIR;
	const outFile = path.join(outDir, `${vqNorm}.mp3`);
	if (fs.existsSync(outFile) && !overwrite) {
		return { file: `/audio/${Number(styleVoice) === 2 ? 'female' : 'male'}/${encodeURIComponent(`${vqNorm}.mp3`)}`, cached: true };
	}
	const speakText = buildSpeakTextFromQueue(vqNorm);
	const buf = await synthesizeBufferDynamic(speakText, styleVoice, speakingRate, maybeApiKey);
	fs.writeFileSync(outFile, buf);
	return { file: `/audio/${Number(styleVoice) === 2 ? 'female' : 'male'}/${encodeURIComponent(`${vqNorm}.mp3`)}`, cached: false };
}

// POST /visit-queue-files { visit_queue_no: "A001" }
// Return list of filenames and URLs under /audio/male
app.post('/visit-queue-files', async (req, res) => {
	const vq = req.body && req.body.visit_queue_no;
	const styleVoiceRaw = req.body && req.body.style_voice;
	const typeInput = req.body && req.body.type;
	const descriptionInput = req.body && req.body.description;
	const nameInput = req.body && req.body.name;
	const pnameInput = req.body && req.body.pname;
	const surnameInput = req.body && req.body.surname;
	const hnInput = req.body && req.body.HN;
	const stationInput = req.body && req.body.station;
	const noticeInput = req.body && req.body.notice_text;
	const speakingRate = getSpeakingRateFromRequest(req);
	// 1 = male (default), 2 = female
	const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1;
	const isERType = String(typeInput || '').toLowerCase() === 'er';
	const subdir = styleVoice === 2 ? 'female' : 'male';
	if (!isOverrideTokenValid(req)) {
		return res.status(401).json({ error: 'Token ไม่ถูกต้อง หรือไม่ได้ตั้งค่า GOOGLE_API_KEY ใน .env' });
	}
	const maybeApiKey = getApiKeyFromRequest(req);
	if (!vq || !String(vq).trim()) {
		return res.status(400).json({ error: 'กรุณาระบุ visit_queue_no ใน body (JSON)' });
	}
	let files = buildQueueFiles(vq);

	// จะใส่ description หลัง surname
	let safeDescription = null;
	let descriptionCacheUrlPrefix = null;

	// หากมี name ให้แทรก name.mp3 ก่อน suffix.mp3
	let safeName = null;
	let nameCacheUrlPrefix = null;
	if (nameInput && String(nameInput).trim()) {
		safeName = normalizeNameForFilename(String(nameInput).trim());
		const nameFileName = `${safeName}.mp3`;
		// ตรวจ/สร้างไฟล์ใน cache ตามเพศ หากยังไม่มี
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		nameCacheUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const nameFilePath = path.join(cacheDir, nameFileName);
		if (!fs.existsSync(nameFilePath)) {
			try {
				const maybeApiKey = getApiKeyFromRequest(req);
				let audioBuffer;
				if (maybeApiKey) {
					audioBuffer = await synthesizeWithApiKey(nameInput, maybeApiKey, styleVoice, speakingRate);
				} else {
					const voiceCandidates = Number(styleVoice) === 2
						? [
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH' }
						]
						: [
							{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH' }
						];
					let lastErr = null;
					for (const voice of voiceCandidates) {
						try {
							const request = {
								input: { text: nameInput },
								voice,
								audioConfig: { audioEncoding: 'MP3', speakingRate }
							};
							const [response] = await ttsClient.synthesizeSpeech(request);
							audioBuffer = Buffer.isBuffer(response.audioContent)
								? response.audioContent
								: Buffer.from(response.audioContent, 'base64');
							break;
						} catch (e) {
							lastErr = e;
							continue;
						}
					}
					if (!audioBuffer) {
						throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงชื่อได้');
					}
				}
				fs.writeFileSync(nameFilePath, audioBuffer);
			} catch (e) {
				console.warn('สร้างไฟล์ชื่อไม่สำเร็จ:', e.message || e);
			}
		}
		// แทรกก่อน suffix
		if (files[files.length - 1] === 'suffix.mp3') {
			files.splice(files.length - 1, 0, nameFileName);
		} else {
			files.push(nameFileName);
		}
	}

	// หากมี surname ให้แทรกต่อจาก name (หรือหลังหมายเลขคิว ถ้าไม่มี name)
	let safeSurname = null;
	let surnameCacheUrlPrefix = null;
	if (surnameInput && String(surnameInput).trim()) {
		safeSurname = normalizeNameForFilename(String(surnameInput).trim());
		const surnameFileName = `${safeSurname}.mp3`;
		// ตรวจ/สร้างไฟล์ใน cache ตามเพศ หากยังไม่มี
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		surnameCacheUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const surnameFilePath = path.join(cacheDir, surnameFileName);
		if (!fs.existsSync(surnameFilePath)) {
			try {
				const maybeApiKey = getApiKeyFromRequest(req);
				let audioBuffer;
				if (maybeApiKey) {
					audioBuffer = await synthesizeWithApiKey(surnameInput, maybeApiKey, styleVoice, speakingRate);
				} else {
					const voiceCandidates = Number(styleVoice) === 2
						? [
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH' }
						]
						: [
							{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH' }
						];
					let lastErr = null;
					for (const voice of voiceCandidates) {
						try {
							const request = {
								input: { text: surnameInput },
								voice,
								audioConfig: { audioEncoding: 'MP3', speakingRate }
							};
							const [response] = await ttsClient.synthesizeSpeech(request);
							audioBuffer = Buffer.isBuffer(response.audioContent)
								? response.audioContent
								: Buffer.from(response.audioContent, 'base64');
							break;
						} catch (e) {
							lastErr = e;
							continue;
						}
					}
					if (!audioBuffer) {
						throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงนามสกุลได้');
					}
				}
				fs.writeFileSync(surnameFilePath, audioBuffer);
			} catch (e) {
				console.warn('สร้างไฟล์นามสกุลไม่สำเร็จ:', e.message || e);
			}
		}
		// แทรกก่อน station (หรือท้ายลิสต์หากไม่มี station)
		if (files[files.length - 1] === 'suffix.mp3') {
			files.splice(files.length - 1, 0, surnameFileName);
		} else {
			files.push(surnameFileName);
		}
	}

	// ใส่ description หลัง surname (หรือหลัง name ถ้าไม่มี surname)
	if (descriptionInput && String(descriptionInput).trim()) {
		safeDescription = sanitizeFileName(String(descriptionInput).trim());
		const descriptionFileName = `${safeDescription}.mp3`;
		// ตรวจ/สร้างไฟล์ใน cache ตามเพศ หากยังไม่มี
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		descriptionCacheUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const descriptionFilePath = path.join(cacheDir, descriptionFileName);
		if (!fs.existsSync(descriptionFilePath)) {
			try {
				const maybeApiKey = getApiKeyFromRequest(req);
				let audioBuffer;
				if (maybeApiKey) {
					audioBuffer = await synthesizeWithApiKey(descriptionInput, maybeApiKey, styleVoice, speakingRate);
				} else {
					const voiceCandidates = Number(styleVoice) === 2
						? [
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH' }
						]
						: [
							{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH' }
						];
					let lastErr = null;
					for (const voice of voiceCandidates) {
						try {
							const request = {
								input: { text: descriptionInput },
								voice,
								audioConfig: { audioEncoding: 'MP3', speakingRate }
							};
							const [response] = await ttsClient.synthesizeSpeech(request);
							audioBuffer = Buffer.isBuffer(response.audioContent)
								? response.audioContent
								: Buffer.from(response.audioContent, 'base64');
							break;
						} catch (e) {
							lastErr = e;
							continue;
						}
					}
					if (!audioBuffer) {
						throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียง description ได้');
					}
				}
				fs.writeFileSync(descriptionFilePath, audioBuffer);
			} catch (e) {
				console.warn('สร้างไฟล์ description ไม่สำเร็จ:', e.message || e);
			}
		}
		files.push(descriptionFileName);
	}
	// หากมี station ให้แทรก station.mp3 ก่อน suffix.mp3 (พูดว่า 'ที่ {station}' ขณะสังเคราะห์)
	let safeStation = null;
	let stationCacheUrlPrefix = null;
	if (stationInput && String(stationInput).trim()) {
		safeStation = normalizeStationForFilename(String(stationInput).trim());
		const stationFileName = `${safeStation}.mp3`;
		// ตรวจ/สร้างไฟล์ใน cache ตามเพศ หากยังไม่มี
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		stationCacheUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const stationFilePath = path.join(cacheDir, stationFileName);
		if (!fs.existsSync(stationFilePath)) {
			try {
				const maybeApiKey = getApiKeyFromRequest(req);
				const polite = Number(styleVoice) === 2 ? 'ค่ะ' : 'ครับ';
				const ttsText = `ที่ ${stationInput} ${polite}`;
				let audioBuffer;
				if (maybeApiKey) {
					audioBuffer = await synthesizeWithApiKey(ttsText, maybeApiKey, styleVoice, speakingRate);
				} else {
					const voiceCandidates = Number(styleVoice) === 2
						? [
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH' }
						]
						: [
							{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH' }
						];
					let lastErr = null;
					for (const voice of voiceCandidates) {
						try {
							const request = {
								input: { text: ttsText },
								voice,
								audioConfig: { audioEncoding: 'MP3', speakingRate }
							};
							const [response] = await ttsClient.synthesizeSpeech(request);
							audioBuffer = Buffer.isBuffer(response.audioContent)
								? response.audioContent
								: Buffer.from(response.audioContent, 'base64');
							break;
						} catch (e) {
							lastErr = e;
							continue;
						}
					}
					if (!audioBuffer) {
						throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงสถานีได้');
					}
				}
				fs.writeFileSync(stationFilePath, audioBuffer);
			} catch (e) {
				console.warn('สร้างไฟล์สถานีไม่สำเร็จ:', e.message || e);
			}
		}
		// แทรกก่อน suffix (หลัง name หากมี)
		if (files[files.length - 1] === 'suffix.mp3') {
			files.splice(files.length - 1, 0, stationFileName);
		} else {
			files.push(stationFileName);
		}
	}

	// หากมี notice_text ให้เพิ่มไว้ท้ายสุด
	let safeNotice = null;
	let noticeCacheUrlPrefix = null;
	if (noticeInput && String(noticeInput).trim()) {
		safeNotice = sanitizeFileName(String(noticeInput).trim());
		const noticeFileName = `${safeNotice}.mp3`;
		// ตรวจ/สร้างไฟล์ใน cache ตามเพศ หากยังไม่มี
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		noticeCacheUrlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const noticeFilePath = path.join(cacheDir, noticeFileName);
		if (!fs.existsSync(noticeFilePath)) {
			try {
				const maybeApiKey = getApiKeyFromRequest(req);
				const polite = Number(styleVoice) === 2 ? 'ค่ะ' : 'ครับ';
				const ttsText = `${noticeInput} ${polite}`;
				let audioBuffer;
				if (maybeApiKey) {
					audioBuffer = await synthesizeWithApiKey(ttsText, maybeApiKey, styleVoice, speakingRate);
				} else {
					const voiceCandidates = Number(styleVoice) === 2
						? [
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
							{ languageCode: 'th-TH' }
						]
						: [
							{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH', ssmlGender: 'MALE' },
							{ languageCode: 'th-TH' }
						];
					let lastErr = null;
					for (const voice of voiceCandidates) {
						try {
							const request = {
								input: { text: ttsText },
								voice,
								audioConfig: { audioEncoding: 'MP3', speakingRate }
							};
							const [response] = await ttsClient.synthesizeSpeech(request);
							audioBuffer = Buffer.isBuffer(response.audioContent)
								? response.audioContent
								: Buffer.from(response.audioContent, 'base64');
							break;
						} catch (e) {
							lastErr = e;
							continue;
						}
					}
					if (!audioBuffer) {
						throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียง notice_text ได้');
					}
				}
				fs.writeFileSync(noticeFilePath, audioBuffer);
			} catch (e) {
				console.warn('สร้างไฟล์ notice_text ไม่สำเร็จ:', e.message || e);
			}
		}
		files.push(noticeFileName);
	}

	// ตรวจว่าให้รวมเป็นไฟล์เดียวหรือไม่ (ดีฟอลต์: รวมเสมอในระบบใหม่)
	const mergeFlagRaw = (req.body && (req.body.merge ?? req.query?.merge));
	const mergeFlag = mergeFlagRaw === undefined ? true : (String(mergeFlagRaw).toLowerCase() === 'true' || String(mergeFlagRaw) === '1' || mergeFlagRaw === true);
	if (mergeFlag) {
		try {
			// ถ้ามี HN ให้เช็คไฟล์ merge ใน temp ก่อน
			if (hnInput && String(hnInput).trim()) {
				const hnNorm = String(hnInput).trim();
				const mergedTempFileName = `HN${hnNorm}.mp3`;
				const mergedTempFilePath = path.join(AUDIO_TEMP_DIR, mergedTempFileName);
				if (fs.existsSync(mergedTempFilePath)) {
					// มีไฟล์ merge อยู่แล้วใน temp → return เลย
					return res.json({
						visit_queue_no: String(vq),
						style_voice: styleVoice,
						description: descriptionInput || null,
						name: nameInput || null,
						pname: pnameInput || null,
						surname: surnameInput || null,
						HN: hnNorm,
						station: stationInput || null,
						notice_text: noticeInput || null,
						files: [],
						urls: [],
						merged_file: `/audio/temp/${encodeURIComponent(mergedTempFileName)}`,
						ttl_ms: TEMP_TTL_MS,
						cached: true
					});
				}
			}

			// ใช้ไฟล์คิวที่ merge ไว้แล้วโดยตรง (เช่น A001.mp3) แทนการ merge ไฟล์แยกๆ
			const staticDir = styleVoice === 2 ? AUDIO_FEMALE_DIR : AUDIO_SAVE_DIR;
			const absPaths = [];
			// เติม prefix.mp3 (เช่น "ขอเชิญหมายเลข") เป็นไฟล์แรก ถ้ามี
			const prefixFilePath = path.join(staticDir, 'prefix.mp3');
			if (fs.existsSync(prefixFilePath)) {
				absPaths.push(prefixFilePath);
			}
			// แปลง visit_queue_no เป็นชื่อไฟล์ เช่น "A001" -> "A001.mp3"
			const vqNorm = String(vq || '').trim().toUpperCase();
			const queueFileName = `${vqNorm}.mp3`;
			const queueFilePath = path.join(staticDir, queueFileName);
			if (!fs.existsSync(queueFilePath)) {
				// ถ้าไม่มีไฟล์คิว ให้สร้างใหม่แล้วเก็บเป็นไฟล์คิว (ทำหน้าที่เหมือน cache)
				try {
					await synthesizeQueueToFile(vqNorm, styleVoice, speakingRate, maybeApiKey, false);
				} catch (e) {
					return res.status(500).json({
						error: `ไม่สามารถสร้างไฟล์คิว: ${queueFileName}`,
						detail: String(e.message || e)
					});
				}
				// ถ้ายังไม่เจออีก แสดงว่ามีปัญหาอื่น
				if (!fs.existsSync(queueFilePath)) {
					return res.status(500).json({ error: `ไม่พบหรือไม่สามารถสร้างไฟล์คิว: ${queueFileName} ใน /audio/${subdir}` });
				}
			}
			absPaths.push(queueFilePath);

			// จัดการ HN: ใช้ไฟล์จาก patients folder แทน name และ surname
			let hnFilePath = null;
			if (hnInput && String(hnInput).trim()) {
				const hnNorm = String(hnInput).trim();
				const hnFileName = `HN${hnNorm}.mp3`;
				const patientsDir = styleVoice === 2 ? AUDIO_PATIENTS_FEMALE_DIR : AUDIO_PATIENTS_MALE_DIR;
				const hnFilePathInPatients = path.join(patientsDir, hnFileName);

				if (fs.existsSync(hnFilePathInPatients)) {
					// มีไฟล์ใน patients folder → ใช้ไฟล์นั้น
					hnFilePath = hnFilePathInPatients;
				} else {
					// ไม่มีไฟล์ → ต้องสร้างใหม่
					if (!nameInput || !String(nameInput).trim()) {
						return res.status(400).json({ error: `ไม่พบไฟล์ HN${hnNorm}.mp3 ใน patients folder และไม่ได้ส่ง name มา` });
					}

					// สร้างไฟล์ใหม่ใน patients folder (ทั้ง male และ female)
					const nameText = String(nameInput).trim();
					const surnameText = surnameInput && String(surnameInput).trim() ? ` ${String(surnameInput).trim()}` : '';
					const fullNameText = `${nameText}${surnameText}`;

					for (const sv of [1, 2]) {
						const targetPatientsDir = sv === 2 ? AUDIO_PATIENTS_FEMALE_DIR : AUDIO_PATIENTS_MALE_DIR;
						const targetFilePath = path.join(targetPatientsDir, hnFileName);
						
						if (!fs.existsSync(targetFilePath)) {
							try {
								const targetApiKey = getApiKeyFromRequest(req);
								const audioBuffer = await synthesizeBufferDynamic(fullNameText, sv, speakingRate, targetApiKey);
								fs.writeFileSync(targetFilePath, audioBuffer);
								// หน่วงเล็กน้อยกัน rate limit
								await new Promise(r => setTimeout(r, 80));
							} catch (e) {
								console.warn(`สร้างไฟล์ HN${hnNorm}.mp3 สำหรับ ${sv === 2 ? 'female' : 'male'} ไม่สำเร็จ:`, e.message || e);
							}
						}
					}

					// ใช้ไฟล์ที่สร้างใหม่ (ตรวจสอบว่ามีไฟล์จริงๆ)
					if (fs.existsSync(hnFilePathInPatients)) {
						hnFilePath = hnFilePathInPatients;
					} else {
						return res.status(500).json({ error: `ไม่สามารถสร้างไฟล์ HN${hnNorm}.mp3 ใน patients folder ได้` });
					}
				}
			}

			// สร้างไฟล์ temp สำหรับ pname (เฉพาะเมื่อมี name)
			const dynamicTasks = [];
			// ตรวจสอบว่ามี name หรือ HN หรือไม่ (ถ้าไม่มีทั้งสองอย่าง ไม่ต้องสร้าง pname)
			const hasName = (nameInput && String(nameInput).trim()) || (hnInput && String(hnInput).trim());
			if (hasName) {
				const prefixForAll = getPrefixFromPname(pnameInput);
				if (prefixForAll) {
					dynamicTasks.push(() => synthesizeToTempFile(prefixForAll, styleVoice, speakingRate, maybeApiKey));
				}
			}
			const tempChunks = await Promise.all(dynamicTasks.map(fn => fn()));
			// ต่อท้ายไฟล์ pname จาก temp
			for (const p of tempChunks) {
				absPaths.push(p);
			}

			// เพิ่มไฟล์ HN (ถ้ามี) หรือ name/surname (ถ้าไม่มี HN)
			if (hnFilePath && fs.existsSync(hnFilePath)) {
				// ใช้ไฟล์ HN จาก patients folder
				absPaths.push(hnFilePath);
			} else if (!hnInput || !String(hnInput).trim()) {
				// ไม่มี HN → ใช้ name และ surname แบบเดิม
				if (nameInput && String(nameInput).trim()) {
					// ไม่ต้องเติม "คุณ" ที่นี่ เพราะสร้างชิ้น pname แยกไว้แล้วด้านบน
					const nameText = String(nameInput).trim();
					const nameTempFile = await synthesizeToTempFile(nameText, styleVoice, speakingRate, maybeApiKey);
					absPaths.push(nameTempFile);
					tempChunks.push(nameTempFile);
				}
				if (surnameInput && String(surnameInput).trim()) {
					const surnameTempFile = await synthesizeToTempFile(String(surnameInput).trim(), styleVoice, speakingRate, maybeApiKey);
					absPaths.push(surnameTempFile);
					tempChunks.push(surnameTempFile);
				}
			}
			// ใช้ไฟล์ cache สำหรับ description, notice_text, station (ถ้ามี)
			// description: ใช้ไฟล์ cache ที่สร้างไว้แล้ว
			if (descriptionInput && String(descriptionInput).trim() && safeDescription) {
				const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
				const descriptionFilePath = path.join(cacheDir, `${safeDescription}.mp3`);
				if (fs.existsSync(descriptionFilePath)) {
					absPaths.push(descriptionFilePath);
				}
			}
			// notice_text: ใช้ไฟล์ cache ที่สร้างไว้แล้ว
			if (noticeInput && String(noticeInput).trim() && safeNotice) {
				const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
				const noticeFilePath = path.join(cacheDir, `${safeNotice}.mp3`);
				if (fs.existsSync(noticeFilePath)) {
					absPaths.push(noticeFilePath);
				}
			}
			// station: ใช้ไฟล์ cache ที่สร้างไว้แล้ว (ให้อยู่ท้ายสุด)
			if (stationInput && String(stationInput).trim() && safeStation) {
				const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
				const stationFilePath = path.join(cacheDir, `${safeStation}.mp3`);
				if (fs.existsSync(stationFilePath)) {
					absPaths.push(stationFilePath);
				}
			}
			// ตั้งชื่อไฟล์ merge: ถ้ามี HN ให้ใช้ HN${HN}.mp3 ถ้าไม่มีให้ใช้ชื่อแบบเดิม
			const outBase = (hnInput && String(hnInput).trim()) 
				? `HN${String(hnInput).trim()}.mp3`
				: `merged_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
			const outPath = path.join(AUDIO_TEMP_DIR, outBase);
			await mergeMp3FilesWithFfmpeg(absPaths, outPath);
			// ลบชิ้นชั่วคราวหลังรวมเสร็จ
			for (const tmp of tempChunks) {
				try { fs.unlinkSync(tmp); } catch (_) {}
			}
			// กำหนดเวลาลบไฟล์นี้อัตโนมัติหลังครบ TTL
			setTimeout(() => { try { fs.unlinkSync(outPath); } catch (_) {} }, TEMP_TTL_MS).unref?.();
			return res.json({
				visit_queue_no: String(vq),
				style_voice: styleVoice,
				description: descriptionInput || null,
				name: nameInput || null,
				pname: pnameInput || null,
				surname: surnameInput || null,
				HN: hnInput || null,
				station: stationInput || null,
				notice_text: noticeInput || null,
				files, // รายการพื้นฐาน (เพื่อ debug)
				urls: [], // ระบบใหม่ไม่ใช้ URL รายไฟล์เมื่อ merge
				merged_file: `/audio/temp/${encodeURIComponent(outBase)}`,
				ttl_ms: TEMP_TTL_MS
			});
		} catch (e) {
			const msg = (e && e.code === 'ENOENT') ? 'ไม่พบคำสั่ง ffmpeg ในเซิร์ฟเวอร์ กรุณาติดตั้ง ffmpeg' : (e.message || String(e));
			return res.status(500).json({ error: 'รวมไฟล์เสียงไม่สำเร็จ', detail: msg });
		}
	}

	// โหมดเดิม (ไม่ merge): ทำ mapping เป็น URL ตามแหล่งที่มา
	const urls = files.map(name => {
		if (safeDescription && name === `${safeDescription}.mp3`) {
			return `${descriptionCacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeName && name === `${safeName}.mp3`) {
			return `${nameCacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeSurname && name === `${safeSurname}.mp3`) {
			return `${surnameCacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeStation && name === `${safeStation}.mp3`) {
			return `${stationCacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		if (safeNotice && name === `${safeNotice}.mp3`) {
			return `${noticeCacheUrlPrefix}/${encodeURIComponent(name)}`;
		}
		return `/audio/${subdir}/${encodeURIComponent(name)}`;
	});

	return res.json({
		visit_queue_no: String(vq),
		style_voice: styleVoice,
		description: descriptionInput || null,
		name: nameInput || null,
		pname: pnameInput || null,
		surname: surnameInput || null,
		HN: hnInput || null,
		station: stationInput || null,
		notice_text: noticeInput || null,
		files,
		urls
	});
});
// Google TTS client with flexible credential sources
function createTtsClient() {
	// 1) Inline JSON via env GOOGLE_CLOUD_CREDENTIALS_JSON
	if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
		try {
			const json = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
			if (json.client_email && json.private_key) {
				return new textToSpeech.TextToSpeechClient({
					projectId: json.project_id,
					credentials: {
						client_email: json.client_email,
						private_key: json.private_key
					}
				});
			}
		} catch (e) {
			console.warn('ไม่สามารถ parse GOOGLE_CLOUD_CREDENTIALS_JSON:', e.message);
		}
	}
	// 2) Path via env GOOGLE_APPLICATION_CREDENTIALS
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		if (fs.existsSync(keyFile)) {
			return new textToSpeech.TextToSpeechClient({ keyFilename: keyFile });
		} else {
			console.warn('ไม่พบไฟล์ที่ GOOGLE_APPLICATION_CREDENTIALS ชี้ไป:', keyFile);
		}
	}
	// 3) Default application credentials (e.g. gcloud auth application-default login)
	return new textToSpeech.TextToSpeechClient();
}
const ttsClient = createTtsClient();

// Use API Key with REST when provided
async function synthesizeWithApiKey(inputText, apiKey, styleVoice = 1, speakingRate = 2) {
	const url = 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(apiKey);
	const isFemale = Number(styleVoice) === 2;
	const candidates = isFemale
		? [
			// Prefer female voices; Neural2-* อาจไม่มีในบางโปรเจกต์ จึงเริ่มที่ Wavenet/Standard
			{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
			{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
			{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
			{ languageCode: 'th-TH' }
		]
		: [
			// Male (default)
			{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
			{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
			{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
			{ languageCode: 'th-TH', ssmlGender: 'MALE' },
			{ languageCode: 'th-TH' }
		];
	let lastErr = null;
	for (const voice of candidates) {
		const body = {
			input: { text: inputText },
			voice,
			audioConfig: { audioEncoding: 'MP3', speakingRate }
		};
		const resp = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!resp.ok) {
			const text = await resp.text().catch(() => '');
			lastErr = new Error(`TTS REST error ${resp.status}: ${text}`);
			// ถ้าเป็นกรณีเสียงไม่พบ ให้ลองตัวถัดไป
			if (text.includes('does not exist') || text.includes('INVALID_ARGUMENT')) {
				continue;
			}
			throw lastErr;
		}
		const data = await resp.json();
		if (data.audioContent) {
			return Buffer.from(data.audioContent, 'base64');
		}
		lastErr = new Error('No audioContent in response');
	}
	throw lastErr || new Error('Unknown TTS error');
}

function getApiKeyFromRequest(req) {
	// ถ้ามี Token ส่งมา (เช่น จาก Swagger) ให้ใช้ค่านั้น
	const headerKey = req.get('x-google-api-key') || (req.query && req.query.key);
	if (headerKey) return headerKey;
	// ถ้าไม่มี Token ให้ fallback ไปใช้ค่าใน .env
	return process.env.GOOGLE_API_KEY || null;
}

// ใช้เช็คเฉพาะกรณีที่มี Token override เข้ามา (เช่น จาก Swagger)
function isOverrideTokenValid(req) {
	const headerKey = req.get('x-google-api-key') || (req.query && req.query.key);
	if (!headerKey) return true; // ไม่มีการ override → ถือว่า valid (ใช้ .env ตามปกติ)
	const expectedToken = process.env.GOOGLE_API_KEY;
	return !!expectedToken && headerKey === expectedToken;
}

// endpoint สำหรับตรวจสอบ Token โดยเฉพาะ (ใช้จาก Swagger UI)
app.get('/token-check', (req, res) => {
	const headerKey = req.get('x-google-api-key') || (req.query && req.query.key);
	const expectedToken = process.env.GOOGLE_API_KEY;
	if (!headerKey || !expectedToken || headerKey !== expectedToken) {
		return res.status(401).json({ ok: false, error: 'Token ไม่ถูกต้อง หรือไม่ได้ตั้งค่า GOOGLE_API_KEY ใน .env' });
	}
	return res.json({ ok: true });
});

// Parse speaking rate (default a bit faster for snappier playback)
function getSpeakingRateFromRequest(req) {
	// Accept speaking_rate or speed from query/body
	const sourceIsGet = req.method === 'GET';
	const raw = sourceIsGet
		? (req.query && (req.query.speaking_rate ?? req.query.speed))
		: (req.body && (req.body.speaking_rate ?? req.body.speed));
	let rate = Number(raw);
	if (!Number.isFinite(rate) || rate <= 0) {
		// Default faster playback
		rate = 1.15;
	}
	// Clamp to Google TTS valid range
	if (rate < 0.25) rate = 0.25;
	if (rate > 4.0) rate = 4.0;
	return rate;
}

// (removed) listVoicesWithApiKey helper

function logCredentialStatus() {
	if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
		console.log('ใช้ credentials จากตัวแปร GOOGLE_CLOUD_CREDENTIALS_JSON');
		return;
	}
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		if (fs.existsSync(p)) {
			console.log('ใช้ไฟล์ credentials ที่:', p);
		} else {
			console.warn('คำเตือน: ตั้งค่า GOOGLE_APPLICATION_CREDENTIALS แล้ว แต่ไม่พบไฟล์:', p);
		}
		return;
	}
	if (process.env.GOOGLE_API_KEY) {
		console.log('ใช้ GOOGLE_API_KEY จาก .env/ENV (REST API)');
		return;
	}
	console.log('ไม่ได้ตั้งค่า credentials ชัดเจน จะพยายามใช้ Application Default Credentials หรือส่ง API Key มากับคำขอ');
}

// GET /tts?text=คำ หรือ POST /tts { "text": "คำ" }
app.all('/tts', async (req, res) => {
	try {
		const inputText = req.method === 'GET' ? req.query.text : (req.body && req.body.text);
		const styleVoiceRaw = req.method === 'GET' ? req.query.style_voice : (req.body && req.body.style_voice);
		const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1; // 1=male, 2=female
		const speakingRate = getSpeakingRateFromRequest(req);
		const subdir = styleVoice === 2 ? 'female' : 'male';
		const saveDir = styleVoice === 2 ? AUDIO_FEMALE_DIR : AUDIO_SAVE_DIR;
		if (!inputText || !String(inputText).trim()) {
			return res.status(400).json({ error: 'กรุณาระบุพารามิเตอร์ text' });
		}

		const safeName = sanitizeFileName(inputText);
		const fileName = `${safeName}.mp3`;
		const filePath = path.join(saveDir, fileName);

		// return cached file if exists
		if (fs.existsSync(filePath)) {
			return res.json({
				text: inputText,
				file: `/audio/${subdir}/${encodeURIComponent(fileName)}`,
				cached: true
			});
		}

		// choose path: API key (REST) or Service Account (client lib)
		const maybeApiKey = getApiKeyFromRequest(req);
		let audioBuffer;
		if (maybeApiKey) {
			audioBuffer = await synthesizeWithApiKey(inputText, maybeApiKey, styleVoice, speakingRate);
		} else {
			// client library fallback similar to REST
			const voiceCandidates = Number(styleVoice) === 2
				? [
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH' }
				]
				: [
					{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH' }
				];
			let lastErr = null;
			for (const voice of voiceCandidates) {
				try {
					const request = {
						input: { text: inputText },
						voice,
						audioConfig: { audioEncoding: 'MP3', speakingRate }
					};
					const [response] = await ttsClient.synthesizeSpeech(request);
					audioBuffer = Buffer.isBuffer(response.audioContent)
						? response.audioContent
						: Buffer.from(response.audioContent, 'base64');
					break;
				} catch (e) {
					lastErr = e;
					continue;
				}
			}
			if (!audioBuffer) {
				throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงด้วย client library');
			}
		}

		fs.writeFileSync(filePath, audioBuffer);

		return res.json({
			text: inputText,
			file: `/audio/${subdir}/${encodeURIComponent(fileName)}`,
			cached: false
		});
	} catch (err) {
		console.error('TTS error:', err);
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์เสียงได้', detail: String(err.message || err) });
	}
});

// GET /name-tts?name=สมพงษ์ หรือ POST /name-tts { "name": "สมพงษ์" }
// ตรวจใน /audio/cache ก่อน ถ้าไม่มีจึงสังเคราะห์และบันทึก
app.all('/name-tts', async (req, res) => {
	try {
		const inputName = req.method === 'GET' ? req.query.name : (req.body && req.body.name);
		const styleVoiceRaw = req.method === 'GET' ? req.query.style_voice : (req.body && req.body.style_voice);
		const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1; // 1=male, 2=female
		const speakingRate = getSpeakingRateFromRequest(req);
		if (!inputName || !String(inputName).trim()) {
			return res.status(400).json({ error: 'กรุณาระบุพารามิเตอร์ name' });
		}

		const safeName = normalizeNameForFilename(inputName);
		const fileName = `${safeName}.mp3`;
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		const urlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const filePath = path.join(cacheDir, fileName);

		// ใช้ไฟล์จาก cache ถ้ามี
		if (fs.existsSync(filePath)) {
			return res.json({
				name: inputName,
				style_voice: styleVoice,
				file: `${urlPrefix}/${encodeURIComponent(fileName)}`,
				cached: true
			});
		}

		// สังเคราะห์ใหม่แล้วบันทึก
		const maybeApiKey = getApiKeyFromRequest(req);
		let audioBuffer;
		if (maybeApiKey) {
			audioBuffer = await synthesizeWithApiKey(inputName, maybeApiKey, styleVoice, speakingRate);
		} else {
			// ใช้ client library (เลือกเสียงตาม default ชายก่อน)
			const voiceCandidates = Number(styleVoice) === 2
				? [
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH' }
				]
				: [
					{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH' }
				];
			let lastErr = null;
			for (const voice of voiceCandidates) {
				try {
					const request = {
						input: { text: inputName },
						voice,
						audioConfig: { audioEncoding: 'MP3', speakingRate }
					};
					const [response] = await ttsClient.synthesizeSpeech(request);
					audioBuffer = Buffer.isBuffer(response.audioContent)
						? response.audioContent
						: Buffer.from(response.audioContent, 'base64');
					break;
				} catch (e) {
					lastErr = e;
					continue;
				}
			}
			if (!audioBuffer) {
				throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงสำหรับชื่อได้');
			}
		}

		fs.writeFileSync(filePath, audioBuffer);

		return res.json({
			name: inputName,
			style_voice: styleVoice,
			file: `${urlPrefix}/${encodeURIComponent(fileName)}`,
			cached: false
		});
	} catch (err) {
		console.error('Name TTS error:', err);
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์เสียงของชื่อได้', detail: String(err.message || err) });
	}
});

// GET/POST /station-tts?station=... -> สร้าง/ใช้แคชเสียงของสถานี โดยพูดว่า 'ที่ {station}'
app.all('/station-tts', async (req, res) => {
	try {
		const inputStation = req.method === 'GET' ? req.query.station : (req.body && req.body.station);
		const styleVoiceRaw = req.method === 'GET' ? req.query.style_voice : (req.body && req.body.style_voice);
		const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1; // 1=male, 2=female
		const speakingRate = getSpeakingRateFromRequest(req);
		if (!inputStation || !String(inputStation).trim()) {
			return res.status(400).json({ error: 'กรุณาระบุพารามิเตอร์ station' });
		}

		const safeStation = normalizeStationForFilename(inputStation);
		const fileName = `${safeStation}.mp3`;
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		const urlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const filePath = path.join(cacheDir, fileName);

		// ใช้ไฟล์จาก cache ถ้ามี
		if (fs.existsSync(filePath)) {
			return res.json({
				station: inputStation,
				style_voice: styleVoice,
				file: `${urlPrefix}/${encodeURIComponent(fileName)}`,
				cached: true
			});
		}

		// สังเคราะห์ใหม่แล้วบันทึก (เติม 'ที่ ' และคำลงท้ายตามเพศ)
		const polite = Number(styleVoice) === 2 ? 'ค่ะ' : 'ครับ';
		const ttsText = `ที่ ${inputStation} ${polite}`;
		const maybeApiKey = getApiKeyFromRequest(req);
		let audioBuffer;
		if (maybeApiKey) {
			audioBuffer = await synthesizeWithApiKey(ttsText, maybeApiKey, styleVoice, speakingRate);
		} else {
			const voiceCandidates = Number(styleVoice) === 2
				? [
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH' }
				]
				: [
					{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH' }
				];
			let lastErr = null;
			for (const voice of voiceCandidates) {
				try {
					const request = {
						input: { text: ttsText },
						voice,
						audioConfig: { audioEncoding: 'MP3', speakingRate }
					};
					const [response] = await ttsClient.synthesizeSpeech(request);
					audioBuffer = Buffer.isBuffer(response.audioContent)
						? response.audioContent
						: Buffer.from(response.audioContent, 'base64');
					break;
				} catch (e) {
					lastErr = e;
					continue;
				}
			}
			if (!audioBuffer) {
				throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงสถานีได้');
			}
		}

		fs.writeFileSync(filePath, audioBuffer);
		return res.json({
			station: inputStation,
			style_voice: styleVoice,
			file: `${urlPrefix}/${encodeURIComponent(fileName)}`,
			cached: false
		});
	} catch (err) {
		console.error('Station TTS error:', err);
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์เสียงของสถานีได้', detail: String(err.message || err) });
	}
});

// GET/POST /phrase-tts?text=... -> สร้าง/ใช้แคชเสียงสำหรับวลีทั่วไป (ไม่ปรับแก้ข้อความ)
app.all('/phrase-tts', async (req, res) => {
	try {
		const inputText = req.method === 'GET' ? req.query.text : (req.body && req.body.text);
		const styleVoiceRaw = req.method === 'GET' ? req.query.style_voice : (req.body && req.body.style_voice);
		const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1; // 1=male, 2=female
		const speakingRate = getSpeakingRateFromRequest(req);
		if (!inputText || !String(inputText).trim()) {
			return res.status(400).json({ error: 'กรุณาระบุพารามิเตอร์ text' });
		}
		const safe = sanitizeFileName(inputText);
		const fileName = `${safe}.mp3`;
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		const urlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const filePath = path.join(cacheDir, fileName);

		if (fs.existsSync(filePath)) {
			return res.json({ text: inputText, style_voice: styleVoice, file: `${urlPrefix}/${encodeURIComponent(fileName)}`, cached: true });
		}

		const maybeApiKey = getApiKeyFromRequest(req);
		let audioBuffer;
		if (maybeApiKey) {
			audioBuffer = await synthesizeWithApiKey(inputText, maybeApiKey, styleVoice, speakingRate);
		} else {
			const voiceCandidates = Number(styleVoice) === 2
				? [
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH' }
				]
				: [
					{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH' }
				];
			let lastErr = null;
			for (const voice of voiceCandidates) {
				try {
					const request = { input: { text: inputText }, voice, audioConfig: { audioEncoding: 'MP3', speakingRate } };
					const [response] = await ttsClient.synthesizeSpeech(request);
					audioBuffer = Buffer.isBuffer(response.audioContent) ? response.audioContent : Buffer.from(response.audioContent, 'base64');
					break;
				} catch (e) {
					lastErr = e;
					continue;
				}
			}
			if (!audioBuffer) {
				throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงได้');
			}
		}
		fs.writeFileSync(filePath, audioBuffer);
		return res.json({ text: inputText, style_voice: styleVoice, file: `${urlPrefix}/${encodeURIComponent(fileName)}`, cached: false });
	} catch (err) {
		console.error('phrase-tts error:', err);
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์เสียงวลีได้', detail: String(err.message || err) });
	}
});

// GET/POST /notice-tts?text=... -> สร้าง/ใช้แคชเสียง notice โดยเติม 'ครับ/ค่ะ' ตามเพศ
app.all('/notice-tts', async (req, res) => {
	try {
		const inputText = req.method === 'GET' ? req.query.text : (req.body && req.body.text);
		const styleVoiceRaw = req.method === 'GET' ? req.query.style_voice : (req.body && req.body.style_voice);
		const styleVoice = Number(styleVoiceRaw) === 2 ? 2 : 1; // 1=male, 2=female
		const speakingRate = getSpeakingRateFromRequest(req);
		if (!inputText || !String(inputText).trim()) {
			return res.status(400).json({ error: 'กรุณาระบุพารามิเตอร์ text' });
		}
		const polite = Number(styleVoice) === 2 ? 'ค่ะ' : 'ครับ';
		const ttsText = `${inputText} ${polite}`;
		const safe = sanitizeFileName(inputText);
		const fileName = `${safe}.mp3`;
		const cacheDir = styleVoice === 2 ? AUDIO_CACHE_FEMALE_DIR : AUDIO_CACHE_MALE_DIR;
		const urlPrefix = styleVoice === 2 ? '/audio/cache/female' : '/audio/cache/male';
		const filePath = path.join(cacheDir, fileName);

		if (fs.existsSync(filePath)) {
			return res.json({ text: inputText, style_voice: styleVoice, file: `${urlPrefix}/${encodeURIComponent(fileName)}`, cached: true });
		}

		const maybeApiKey = getApiKeyFromRequest(req);
		let audioBuffer;
		if (maybeApiKey) {
			audioBuffer = await synthesizeWithApiKey(ttsText, maybeApiKey, styleVoice, speakingRate);
		} else {
			const voiceCandidates = Number(styleVoice) === 2
				? [
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
					{ languageCode: 'th-TH' }
				]
				: [
					{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH', ssmlGender: 'MALE' },
					{ languageCode: 'th-TH' }
				];
			let lastErr = null;
			for (const voice of voiceCandidates) {
				try {
					const request = { input: { text: ttsText }, voice, audioConfig: { audioEncoding: 'MP3', speakingRate } };
					const [response] = await ttsClient.synthesizeSpeech(request);
					audioBuffer = Buffer.isBuffer(response.audioContent) ? response.audioContent : Buffer.from(response.audioContent, 'base64');
					break;
				} catch (e) {
					lastErr = e;
					continue;
				}
			}
			if (!audioBuffer) {
				throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียง notice ได้');
			}
		}
		fs.writeFileSync(filePath, audioBuffer);
		return res.json({ text: inputText, style_voice: styleVoice, file: `${urlPrefix}/${encodeURIComponent(fileName)}`, cached: false });
	} catch (err) {
		console.error('notice-tts error:', err);
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์เสียง notice ได้', detail: String(err.message || err) });
	}
});

// POST /bulk-generate-queues
// body:
// {
//   start_letter?: "A", end_letter?: "Z",
//   start_number?: 1, end_number?: 999,
//   order?: "male_first" | "female_first" | "male" | "female", // default male_first
//   overwrite?: boolean,
//   speaking_rate?: number
// }
// สร้างไฟล์เสียงใหม่ต่อคิว (ไม่ merge) เช่น A001.mp3 ในโฟลเดอร์ตามเพศ
app.post('/bulk-generate-queues', async (req, res) => {
	try {
		const startLetter = (req.body && req.body.start_letter) ? String(req.body.start_letter).toUpperCase().trim()[0] : 'A';
		const endLetter = (req.body && req.body.end_letter) ? String(req.body.end_letter).toUpperCase().trim()[0] : 'Z';
		const startNum = Number(req.body && req.body.start_number) || 1;
		const endNum = Number(req.body && req.body.end_number) || 999;
		let order = (req.body && req.body.order) || 'male_first';
		if (!['male_first', 'female_first', 'male', 'female'].includes(order)) order = 'male_first';
		const overwrite = !!(req.body && req.body.overwrite);
		const speakingRate = getSpeakingRateFromRequest(req);
		const maybeApiKey = getApiKeyFromRequest(req);

		const codeA = 'A'.charCodeAt(0);
		const codeZ = 'Z'.charCodeAt(0);
		const from = Math.max(codeA, (startLetter || 'A').charCodeAt(0));
		const to = Math.min(codeZ, (endLetter || 'Z').charCodeAt(0));
		if (from > to) {
			return res.status(400).json({ error: 'ช่วงตัวอักษรไม่ถูกต้อง' });
		}
		if (startNum < 1 || endNum > 999 || startNum > endNum) {
			return res.status(400).json({ error: 'ช่วงหมายเลขต้องอยู่ใน 1..999 และ start <= end' });
		}

		// จัดลำดับเพศ
		let styles;
		switch (order) {
			case 'male': styles = [1]; break;
			case 'female': styles = [2]; break;
			case 'female_first': styles = [2, 1]; break;
			default: styles = [1, 2]; // male_first
		}

		const report = [];
		for (const styleVoice of styles) {
			for (let c = from; c <= to; c++) {
				const letter = String.fromCharCode(c);
				for (let n = startNum; n <= endNum; n++) {
					const vq = `${letter}${String(n).padStart(3, '0')}`;
					try {
						const { file, cached } = await synthesizeQueueToFile(vq, styleVoice, speakingRate, maybeApiKey, overwrite);
						report.push({ vq, style_voice: styleVoice, file, cached });
						// หน่วงเล็กน้อยกัน rate limit
						await new Promise(r => setTimeout(r, 80));
					} catch (e) {
						report.push({ vq, style_voice: styleVoice, error: String(e.message || e) });
					}
				}
			}
		}

		return res.json({ ok: true, total: report.length, items: report });
	} catch (err) {
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์แบบชุดได้', detail: String(err.message || err) });
	}
});

// POST /generate-patient-audio
// body: { patients: [{HN: "12345", name: "สมชาย ใจดี"}, ...] }
// Generate เสียงจาก name แล้วเก็บเป็น HN.mp3 ใน audio/patients/male และ audio/patients/female (ทั้งสองเพศอัตโนมัติ)
app.post('/generate-patient-audio', async (req, res) => {
	try {
		const patientsInput = req.body && req.body.patients;
		if (!isOverrideTokenValid(req)) {
			return res.status(401).json({ error: 'Token ไม่ถูกต้อง หรือไม่ได้ตั้งค่า GOOGLE_API_KEY ใน .env' });
		}
		const maybeApiKey = getApiKeyFromRequest(req);
		const speakingRate = 1.15; // default speaking rate

		if (!Array.isArray(patientsInput) || patientsInput.length === 0) {
			return res.status(400).json({ error: 'กรุณาส่ง array ของ patients ที่มี HN และ name' });
		}

		// จำกัดจำนวนสูงสุดต่อคำขอเพื่อไม่ให้โหลดระบบเกินไป
		if (patientsInput.length > 100) {
			return res.status(400).json({
				error: 'รองรับไม่เกิน 100 คนต่อคำขอ',
				max: 100,
				received: patientsInput.length
			});
		}

		const report = [];

		for (const patient of patientsInput) {
			const hn = patient && patient.HN;
			const name = patient && patient.name;

			if (!hn || !String(hn).trim()) {
				report.push({ HN: hn || null, name: name || null, error: 'HN ไม่ถูกต้อง' });
				continue;
			}

			if (!name || !String(name).trim()) {
				report.push({ HN: String(hn).trim(), name: name || null, error: 'name ไม่ถูกต้อง' });
				continue;
			}

			const hnNorm = String(hn).trim();
			const nameText = String(name).trim();
			const fileName = `HN${hnNorm}.mp3`;

			// Generate ทั้ง male และ female
			for (const styleVoice of [1, 2]) {
				const patientsDir = styleVoice === 2 ? AUDIO_PATIENTS_FEMALE_DIR : AUDIO_PATIENTS_MALE_DIR;
				const urlPrefix = styleVoice === 2 ? '/audio/patients/female' : '/audio/patients/male';
				const filePath = path.join(patientsDir, fileName);

				// ตรวจสอบว่ามีไฟล์อยู่แล้วหรือไม่ (ไม่ overwrite)
				if (fs.existsSync(filePath)) {
					report.push({
						HN: hnNorm,
						name: nameText,
						style_voice: styleVoice,
						file: `${urlPrefix}/${encodeURIComponent(fileName)}`,
						cached: true
					});
					continue;
				}

				// Generate เสียงใหม่
				try {
					let audioBuffer;
					if (maybeApiKey) {
						audioBuffer = await synthesizeWithApiKey(nameText, maybeApiKey, styleVoice, speakingRate);
					} else {
						const voiceCandidates = Number(styleVoice) === 2
							? [
								{ languageCode: 'th-TH', name: 'th-TH-Wavenet-A', ssmlGender: 'FEMALE' },
								{ languageCode: 'th-TH', name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
								{ languageCode: 'th-TH', ssmlGender: 'FEMALE' },
								{ languageCode: 'th-TH' }
							]
							: [
								{ languageCode: 'th-TH', name: 'th-TH-Neural2-B', ssmlGender: 'MALE' },
								{ languageCode: 'th-TH', name: 'th-TH-Wavenet-B', ssmlGender: 'MALE' },
								{ languageCode: 'th-TH', name: 'th-TH-Standard-B', ssmlGender: 'MALE' },
								{ languageCode: 'th-TH', ssmlGender: 'MALE' },
								{ languageCode: 'th-TH' }
							];
						let lastErr = null;
						for (const voice of voiceCandidates) {
							try {
								const request = {
									input: { text: nameText },
									voice,
									audioConfig: { audioEncoding: 'MP3', speakingRate }
								};
								const [response] = await ttsClient.synthesizeSpeech(request);
								audioBuffer = Buffer.isBuffer(response.audioContent)
									? response.audioContent
									: Buffer.from(response.audioContent, 'base64');
								break;
							} catch (e) {
								lastErr = e;
								continue;
							}
						}
						if (!audioBuffer) {
							throw lastErr || new Error('ไม่สามารถสังเคราะห์เสียงได้');
						}
					}

					fs.writeFileSync(filePath, audioBuffer);
					report.push({
						HN: hnNorm,
						name: nameText,
						style_voice: styleVoice,
						file: `${urlPrefix}/${encodeURIComponent(fileName)}`,
						cached: false
					});

					// หน่วงเล็กน้อยกัน rate limit
					await new Promise(r => setTimeout(r, 80));
				} catch (e) {
					report.push({
						HN: hnNorm,
						name: nameText,
						style_voice: styleVoice,
						error: String(e.message || e)
					});
				}
			}
		}

		const success = report.filter(x => !x.error).length;
		const failed = report.length - success;

		return res.json({
			ok: true,
			total: report.length,
			success,
			failed,
			items: report
		});
	} catch (err) {
		return res.status(500).json({ error: 'ไม่สามารถสร้างไฟล์เสียงผู้ป่วยได้', detail: String(err.message || err) });
	}
});

// root handled by express.static -> public/index.html

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
	logCredentialStatus();
});



