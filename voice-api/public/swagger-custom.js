// สคริปต์เสริมสำหรับ Swagger UI:
// - เด้งหน้าต่าง Authorize ให้อัตโนมัติเมื่อโหลดหน้า
// - ตรวจ Token กับเซิร์ฟเวอร์ผ่าน /token-check ถ้าไม่ถูกต้องจะ logout และบังคับให้ใส่ใหม่

(function () {
	function getSystem() {
		if (!window.ui || typeof window.ui.getSystem !== 'function') return null;
		try {
			return window.ui.getSystem();
		} catch (_) {
			return null;
		}
	}

	async function validateTokenOnce() {
		const system = getSystem();
		if (!system) return;
		try {
			const authState = system.authSelectors.authorized()?.toJS?.() || {};
			const tokenInfo = authState['TokenAuth'];
			const token = tokenInfo && tokenInfo.value;
			if (!token) {
				// ยังไม่ได้ authorize
				return;
			}
			const res = await fetch('/token-check', {
				method: 'GET',
				headers: {
					'x-google-api-key': token
				}
			});
			if (!res.ok) {
				alert('Token ไม่ถูกต้อง หรือไม่ตรงกับค่าบนเซิร์ฟเวอร์');
				if (system.authActions && typeof system.authActions.logout === 'function') {
					system.authActions.logout('TokenAuth');
				}
				if (system.authActions && typeof system.authActions.showDefinitions === 'function') {
					system.authActions.showDefinitions('TokenAuth');
				}
			}
		} catch (e) {
			// ถ้าตรวจไม่ได้ก็แค่ไม่ทำอะไร ปล่อยให้ backend เป็นตัวกันอีกชั้น
			console.warn('ตรวจสอบ Token ผ่าน swagger-custom.js ไม่สำเร็จ:', e);
		}
	}

	function ensureAuthDialogVisible() {
		const system = getSystem();
		if (!system || !system.authSelectors || !system.authActions) return;
		try {
			const authState = system.authSelectors.authorized()?.toJS?.() || {};
			const hasToken = !!authState['TokenAuth'];
			if (!hasToken && typeof system.authActions.showDefinitions === 'function') {
				system.authActions.showDefinitions('TokenAuth');
			}
		} catch (e) {
			// ignore
		}
	}

	function init() {
		const system = getSystem();
		if (!system) {
			setTimeout(init, 800);
			return;
		}

		// ตอนเริ่มโหลด ถ้ายังไม่ได้ authorize ให้เด้งหน้าต่าง Token ขึ้นมา
		ensureAuthDialogVisible();

		// ทุกครั้งที่มีการเปลี่ยน auth state ให้ลองตรวจ Token
		let lastAuthJson = null;
		setInterval(() => {
			const sys = getSystem();
			if (!sys || !sys.authSelectors) return;
			try {
				const authState = sys.authSelectors.authorized()?.toJS?.() || {};
				const json = JSON.stringify(authState);
				if (json !== lastAuthJson) {
					lastAuthJson = json;
					// มีการเปลี่ยนแปลง auth (เช่น ใส่ Token ใหม่) → ตรวจ Token
					validateTokenOnce();
				}
				// ถ้าไม่มี Token เลย พยายามให้ dialog แสดงอยู่
				const hasToken = !!authState['TokenAuth'];
				if (!hasToken) {
					ensureAuthDialogVisible();
				}
			} catch (_) {
				// ignore
			}
		}, 2000);
	}

	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		setTimeout(init, 500);
	} else {
		window.addEventListener('load', function () {
			setTimeout(init, 500);
		});
	}
})();


