window.addEventListener('load', () => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // HTML要素の取得
    const statusEl = document.getElementById('status');
    const latitudeEl = document.getElementById('latitude');
    const longitudeEl = document.getElementById('longitude');
    const altitudeEl = document.getElementById('altitude');
    const timestampEl = document.getElementById('timestamp');

    // 位置情報が利用可能かチェック
    if (!('geolocation' in navigator)) {
        statusEl.textContent = 'エラー: このブラウザは位置情報をサポートしていません。';
        return;
    }

    // 位置情報取得のオプション
    const options = {
        enableHighAccuracy: true, // 高精度な位置情報を要求
        timeout: 10000,           // 10秒でタイムアウト
        maximumAge: 0             // キャッシュされた位置情報を使わない
    };

    function updateLocation() {
        navigator.geolocation.getCurrentPosition(success, error, options);
    }

    // 取得成功時のコールバック
    function success(position) {
        const { latitude, longitude, altitude } = position.coords;
        const timestamp = new Date(position.timestamp);

        statusEl.textContent = '位置情報を取得しました！';
        
        latitudeEl.textContent = latitude.toFixed(6); // 小数点以下6桁に
        longitudeEl.textContent = longitude.toFixed(6);
        // 標高は取得できない場合があるのでnullチェック
        altitudeEl.textContent = altitude ? `${altitude.toFixed(2)} m` : 'N/A';
        timestampEl.textContent = timestamp.toLocaleString('ja-JP');
    }

    // 取得失敗時のコールバック
    function error(err) {
        console.error(`ERROR(${err.code}): ${err.message}`);
        statusEl.textContent = `エラー: ${err.message}`;
    }

    // 最初に一度実行して、すぐに結果を表示
    updateLocation();
    
    // 3秒ごとに位置情報を更新
    setInterval(updateLocation, 3000);
});