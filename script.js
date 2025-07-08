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

    let intervalId = null; // setIntervalのIDを管理する変数

    // ログを追加し、自動スクロールする関数
    function addLog(message, type = '') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        // コンテナの最下部にスクロール
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 位置情報取得のオプション
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    // 取得成功時の処理
    function success(position) {
        const { latitude, longitude, altitude } = position.coords;
        const timestamp = new Date(position.timestamp);

        const latText = `緯度: ${latitude.toFixed(6)}`;
        const lonText = `経度: ${longitude.toFixed(6)}`;
        const altText = altitude ? `標高: ${altitude.toFixed(2)} m` : '標高: N/A';
        const timeText = timestamp.toLocaleString('ja-JP');

        addLog(`${timeText} | ${latText}, ${lonText}, ${altText}`);
    }

    // 取得失敗時の処理
    function error(err) {
        const errorMessage = `エラー(${err.code}): ${err.message}`;
        console.error(errorMessage);
        addLog(errorMessage, 'log-error');
    }

    // 計測開始処理
    function startLogging() {
        if (!('geolocation' in navigator)) {
            addLog('エラー: このブラウザは位置情報をサポートしていません。', 'log-error');
            return;
        }
        
        addLog('計測を開始しました...', 'log-info');
        
        // ボタンの状態を更新
        startButton.disabled = true;
        stopButton.disabled = false;
        
        // 最初のデータをすぐに取得
        navigator.geolocation.getCurrentPosition(success, error, options);
        
        // 3秒ごとに位置情報を取得
        intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(success, error, options);
        }, 3000);
    }

    // 計測終了処理
    function stopLogging() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        
        addLog('計測を終了しました。', 'log-info');
        
        // ボタンの状態を更新
        startButton.disabled = false;
        stopButton.disabled = true;
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startLogging);
    stopButton.addEventListener('click', stopLogging);
});