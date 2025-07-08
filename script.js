window.addEventListener('load', () => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // HTML要素の取得
    const logContainer = document.getElementById('log-container');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const gpxExportCheckbox = document.getElementById('gpxExportCheckbox');

    let intervalId = null; // setIntervalのID
    let gpsDataPoints = []; // GPSデータ(positionオブジェクト)を保存する配列

    // 情報/エラーメッセージをログに追加する関数
    function addInfoLog(message, type = 'log-info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // 計測開始処理
    function startLogging() {
        if (!('geolocation' in navigator)) {
            addInfoLog('エラー: このブラウザは位置情報をサポートしていません。', 'log-error');
            return;
        }
        
        gpsDataPoints = []; // ログデータをリセット
        logContainer.innerHTML = ''; // 画面をクリア
        addInfoLog('計測を開始しました...');
        
        startButton.disabled = true;
        stopButton.disabled = false;
        
        navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        }, 3000);
    }

    // 計測終了処理
    function stopLogging() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        
        addInfoLog('計測を終了しました。');
        
        if (gpxExportCheckbox.checked && gpsDataPoints.length > 0) {
            generateAndDownloadGpx();
        }
        
        startButton.disabled = false;
        stopButton.disabled = true;
    }

    // GPS取得成功時の処理
    function success(position) {
        gpsDataPoints.push(position); // データを配列に保存

        const { latitude, longitude, altitude } = position.coords;
        const timestamp = new Date(position.timestamp);

        const latDir = latitude >= 0 ? '北緯' : '南緯';
        const lonDir = longitude >= 0 ? '東経' : '西経';
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <div class="log-grid">
                <div class="log-label">${latDir}</div>
                <div class="log-value">${Math.abs(latitude).toFixed(6)}</div>
                <div class="log-label">${lonDir}</div>
                <div class="log-value">${Math.abs(longitude).toFixed(6)}</div>
                <div class="log-label">標高</div>
                <div class="log-value">${altitude ? `${altitude.toFixed(2)} m` : 'N/A'}</div>
                <div class="log-label">日時</div>
                <div class="log-value">${timestamp.toLocaleString('ja-JP')}</div>
            </div>
        `;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // GPS取得失敗時の処理
    function error(err) {
        const errorMessage = `エラー(${err.code}): ${err.message}`;
        addInfoLog(errorMessage, 'log-error');
    }

    // GPXファイルを生成してダウンロードさせる関数
    function generateAndDownloadGpx() {
        // 1. ファイル名生成 (yyyymmdd-nnn.gpx)
        const today = new Date();
        const yyyymmdd = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        const storageKey = `gpx_counter_${yyyymmdd}`;
        
        let counter = parseInt(localStorage.getItem(storageKey) || '0', 10) + 1;
        localStorage.setItem(storageKey, counter.toString());
        
        const nnn = counter.toString().padStart(3, '0');
        const fileName = `${yyyymmdd}-${nnn}.gpx`;

        // 2. GPXコンテンツ生成
        const trackpoints = gpsDataPoints.map(p => {
            const { latitude, longitude, altitude } = p.coords;
            const time = new Date(p.timestamp).toISOString();
            const ele = altitude !== null ? `<ele>${altitude}</ele>` : '';
            return `      <trkpt lat="${latitude}" lon="${longitude}">${ele}<time>${time}</time></trkpt>`;
        }).join('\n');

        const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Logger PWA"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Track Log ${yyyymmdd}</name>
    <time>${new Date(gpsDataPoints[0].timestamp).toISOString()}</time>
  </metadata>
  <trk>
    <name>${fileName}</name>
    <trkseg>
${trackpoints}
    </trkseg>
  </trk>
</gpx>`;

        // 3. ダウンロード処理
        const blob = new Blob([gpxContent.trim()], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addInfoLog(`${fileName} を出力しました。`);
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startLogging);
    stopButton.addEventListener('click', stopLogging);
});