// ====================================================================
// ★★★ DOM要素の取得 ★★★
// ====================================================================
const startPage = document.getElementById('start-page');
const mainContent = document.getElementById('main-content');
const startBtn = document.getElementById('start-btn');
const backToStartBtn = document.getElementById('back-to-start-btn');

const cityInputStart = document.getElementById('city-input-start');
const currentLocationBtn = document.getElementById('current-location-btn');

// メイン画面のDOM要素
const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather-btn');
const weatherDisplay = document.getElementById('weather-display');
const weatherHeaderDisplay = document.getElementById('weather-header-display');
const characterImg = document.getElementById('character-img');
const characterComment = document.getElementById('character-comment');
const characterArea = document.querySelector('.character-area');
const forecastDisplay = document.getElementById('forecast-display');
const autocompleteList = document.getElementById('autocomplete-list');
const loadingOverlay = document.getElementById('loading-overlay');

// BGM関連のDOM要素
const bgmToggleBtn = document.getElementById('bgm-toggle-btn');


// ====================================================================
// ★★★ BGM 制御ロジック (Web Audio API - 正確なループ再生) ★★★
// ====================================================================

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let isBGMPlaying = false;
let nextLoopTime = 0;
const LOOKAHEAD_TIME = 0.1;

const chords = [ 
    [261.63, 329.63, 392.00], 
    [220.00, 261.63, 329.63], 
    [174.61, 220.00, 261.63], 
    [196.00, 246.94, 392.00] 
];

const CHORD_DURATION = 2;
const LOOP_LENGTH = chords.length * CHORD_DURATION;

function createNote(freq, start, duration = CHORD_DURATION) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.3);
    gain.gain.linearRampToValueAtTime(0.05, start + duration - 0.3);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.type = "sine";
    osc.frequency.value = freq;

    osc.connect(gain).connect(audioCtx.destination);

    osc.start(start);
    osc.stop(start + duration);
}

function generateMusic() {
    if (!isBGMPlaying) {
        nextLoopTime = audioCtx.currentTime;
        return;
    }

    chords.forEach((chord, i) => {
        const t = nextLoopTime + i * CHORD_DURATION;
        chord.forEach(freq => createNote(freq, t, CHORD_DURATION));
    });

    nextLoopTime += LOOP_LENGTH;

    const timeoutTime = (nextLoopTime - audioCtx.currentTime - LOOKAHEAD_TIME) * 1000;

    setTimeout(generateMusic, Math.max(0, timeoutTime));
}

function stopBGM() {
    isBGMPlaying = false;
    audioCtx.suspend();
}

function startBGM() {

    // ユーザー操作後にaudioCtxが動作していない場合のみresume/start
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    isBGMPlaying = true;

    if (nextLoopTime < audioCtx.currentTime) {
        nextLoopTime = audioCtx.currentTime;
    }

    generateMusic();
}

function toggleBGM() {
    if (isBGMPlaying) {
        stopBGM();
        localStorage.setItem('bgmState', 'off');
        updateBGMButton(false);
    }

    else {
        startBGM();
        localStorage.setItem('bgmState', 'on');
        updateBGMButton(true);
    }
}

function updateBGMButton(isPlaying) {
    if (isPlaying) {
        bgmToggleBtn.innerHTML = 'BGM: ON 🔈';
        bgmToggleBtn.classList.remove('off');
    }

    else {
        bgmToggleBtn.innerHTML = 'BGM: OFF 🔇';
        bgmToggleBtn.classList.add('off');
    }
}

bgmToggleBtn.addEventListener('click', toggleBGM);

// BGMの状態をロードするが、自動再生は試みない (ブラウザの制限対策)
document.addEventListener('DOMContentLoaded', () => {
        const savedState = localStorage.getItem('bgmState');

        if (savedState === 'off') {
            isBGMPlaying = false;
        }

        else {
            isBGMPlaying = true;
        }

        updateBGMButton(isBGMPlaying);
    });


// ====================================================================
// ★★★ ユーティリティ/定数 ★★★
// ====================================================================

const API_KEY = 'b805c0aa4bdcc94949925b79c2c4d405'; // APIキーは公開環境では秘匿化を検討
const CURRENT_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

function setLoading(isLoading) {
    if (isLoading) {
        loadingOverlay.classList.remove('hidden');
        getWeatherBtn.disabled = true;
    }

    else {
        loadingOverlay.classList.add('hidden');
        getWeatherBtn.disabled = false;
    }
}


function getFormattedTodayDate() {
    const today = new Date();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dayOfWeek = weekdays[today.getDay()];

    return `- ${month}月${day}日(${dayOfWeek})`;
}

// ====================================================================
// ★★★ 拡張された CITY_NAME_MAP (地名リスト) - 静岡表記を修正済み ★★★
// ====================================================================
const CITY_NAME_MAP = {
    // -------------------
    // 北海道・東北地方
    // -------------------
    '札幌': 'Sapporo', '北海道': 'Sapporo',
    '青森': 'Aomori', '青森県': 'Aomori',
    '盛岡': 'Morioka', '岩手': 'Morioka', '岩手県': 'Morioka',
    '仙台': 'Sendai', '宮城': 'Sendai', '宮城県': 'Sendai',
    '秋田': 'Akita', '秋田県': 'Akita',
    '山形': 'Yamagata', '山形県': 'Yamagata',
    '福島': 'Fukushima', '福島県': 'Fukushima',

    // -------------------
    // 関東地方
    // -------------------
    '水戸': 'Mito', '茨城': 'Mito', '茨城県': 'Mito',
    '宇都宮': 'Utsunomiya', '栃木': 'Utsunomiya', '栃木県': 'Utsunomiya',
    '前橋': 'Maebashi', '群馬': 'Maebashi', '群馬県': 'Maebashi',
    'さいたま': 'Saitama', '埼玉': 'Saitama', '埼玉県': 'Saitama',
    '千葉': 'Chiba', '千葉県': 'Chiba',
    '東京': 'Tokyo', '東京都': 'Tokyo',
    '横浜': 'Yokohama', '神奈川': 'Yokohama', '神奈川県': 'Yokohama',

    // -------------------
    // 中部地方
    // -------------------
    '新潟': 'Niigata', '新潟県': 'Niigata',
    '富山': 'Toyama', '富山県': 'Toyama',
    '金沢': 'Kanazawa', '石川': 'Kanazawa', '石川県': 'Kanazawa',
    '福井': 'Fukui', '福井県': 'Fukui',
    '甲府': 'Kofu', '山梨': 'Kofu', '山梨県': 'Kofu',
    '長野': 'Nagano', '長野県': 'Nagano',
    '岐阜': 'Gifu', '岐阜県': 'Gifu',
    // --- ★★★ ここを 'Shizuoka' に修正しました ★★★ ---
    '静岡': 'Shizuoka', '静岡県': 'Shizuoka', 
    // ------------------------------------------------
    '名古屋': 'Nagoya', '愛知': 'Nagoya', '愛知県': 'Nagoya',

    // -------------------
    // 近畿地方
    // -------------------
    '津': 'Tsu', '三重': 'Tsu', '三重県': 'Tsu',
    '大津': 'Otsu', '滋賀': 'Otsu', '滋賀県': 'Otsu',
    '京都': 'Kyoto', '京都府': 'Kyoto',
    '大阪': 'Osaka', '大阪府': 'Osaka',
    '神戸': 'Kobe', '兵庫': 'Kobe', '兵庫県': 'Kobe',
    '奈良': 'Nara', '奈良県': 'Nara',
    '和歌山': 'Wakayama', '和歌山県': 'Wakayama',

    // -------------------
    // 中国・四国地方
    // -------------------
    '鳥取': 'Tottori', '鳥取県': 'Tottori',
    '松江': 'Matsue', '島根': 'Matsue', '島根県': 'Matsue',
    '岡山': 'Okayama', '岡山県': 'Okayama',
    '広島': 'Hiroshima', '広島県': 'Hiroshima',
    '山口': 'Yamaguchi', '山口県': 'Yamaguchi',
    '徳島': 'Tokushima', '徳島県': 'Tokushima',
    '高松': 'Takamatsu', '香川': 'Takamatsu', '香川県': 'Takamatsu',
    '松山': 'Matsuyama', '愛媛': 'Matsuyama', '愛媛県': 'Matsuyama',
    '高知': 'Kochi', '高知県': 'Kochi',

    // -------------------
    // 九州・沖縄地方
    // -------------------
    '福岡': 'Fukuoka', '福岡県': 'Fukuoka',
    '佐賀': 'Saga', '佐賀県': 'Saga',
    '長崎': 'Nagasaki', '長崎県': 'Nagasaki',
    '熊本': 'Kumamoto', '熊本県': 'Kumamoto',
    '大分': 'Oita', '大分県': 'Oita',
    '宮崎': 'Miyazaki', '宮崎県': 'Miyazaki',
    '鹿児島': 'Kagoshima', '鹿児島県': 'Kagoshima',
    '那覇': 'Naha', '沖縄': 'Naha', '沖縄県': 'Naha',

    // -------------------
    // その他の主要都市（既存のもの）
    // -------------------
    '唐津': 'Karatsu',
    '別府': 'Beppu', '中津': 'Nakatsu', '日田': 'Hita', '佐伯': 'Saiki', '臼杵': 'Usuki', '津久見': 'Tsukumi', '竹田': 'Taketa', '豊後高田': 'Bungo-Takada', '杵築': 'Kitsuki', '宇佐': 'Usa', '豊後大野': 'Bungo-ono', '由布': 'Yufu', '国東': 'Kunisaki', '日出': 'Hiji', '玖珠': 'Kusu', '九重': 'Kokonoe',

    // -------------------
    // 世界の主要都市
    // -------------------
    'パリ': 'Paris',
    'ロンドン': 'London',
    'ニューヨーク': 'New York',
    'ソウル': 'Seoul',
    '北京': 'Beijing',
    '上海': 'Shanghai',
    'バンコク': 'Bangkok',
    'シンガポール': 'Singapore',
    '香港': 'Hong Kong',
    '台北': 'Taipei',
    'ハワイ': 'Honolulu',
    'ロサンゼルス': 'Los Angeles',
    'バンクーバー': 'Vancouver',
    'ローマ': 'Rome',
    'ベルリン': 'Berlin',
    'モスクワ': 'Moscow',
    'シドニー': 'Sydney',
    'リオデジャネイロ': 'Rio de Janeiro',
    'カイロ': 'Cairo',
};


// ====================================================================
// ★★★ 天気ごとのキャラクター画像・コメント定義 ★★★
// ====================================================================
const weatherMap = {
    'Clear': {
        image: 'img/character_clear.png',
        comment: (city) => `${city}は快晴だよ！お出かけ日和だね！☀️`,
        bgColor: '#FFE0B2',
        borderColor: '#FFC107'
    },
    'Clouds': {
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は曇りかぁ。念のため、傘を持っていこう！☁️`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Rain': {
        image: 'img/character_rain.png',
        comment: (city) => `${city}は雨が降っているよ。濡れないように気をつけてね☔️`,
        bgColor: '#B3E5FC',
        borderColor: '#2196F3'
    },
    'Mist': {
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は霧が出てるみたい。運転や足元に注意だよ！`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Fog': { // 濃霧
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は濃い霧だよ。運転や足元に注意してね！`, 
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Haze': { // もや
        image: 'img/character_clouds.png',
        comment: (city) => `${city}はもやがかかっているよ。視界に気をつけてね！`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Smoke': { // 煙
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は煙が報告されているよ。空気に注意！`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Dust': { // 塵
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は塵（ちり）が多いみたい。マスクの着用をおすすめするよ！`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Sand': { // 砂
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は砂が多いみたい。空気に注意だよ！`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Ash': { // 火山灰
        image: 'img/character_clouds.png',
        comment: (city) => `${city}は火山灰が降っているかも。空気に注意だよ！`,
        bgColor: '#E0E0E0',
        borderColor: '#9E9E9E'
    },
    'Squall': { // スコール/突風
        image: 'img/character_rain.png',
        comment: (city) => `${city}は突風やスコールに注意！急な天候変化に備えてね！`,
        bgColor: '#B3E5FC',
        borderColor: '#2196F3'
    },
    'Tornado': { // トルネード
        image: 'img/character_rain.png',
        comment: (city) => `${city}は竜巻注意報が出ているよ！安全な場所に避難して！`,
        bgColor: '#B3E5FC',
        borderColor: '#9C27B0'
    },
    'Snow': {
        image: 'img/character_snow.png',
        comment: (city) => `${city}は雪！積もるかな？あったかくしてね！☃️`,
        bgColor: '#E3F2FD',
        borderColor: '#00BCD4'
    },
    'Thunderstorm': {
        image: 'img/character_rain.png', 
        comment: (city) => `${city}は雷雨の予報！気をつけてね⚡️`,
        bgColor: '#B3E5FC',
        borderColor: '#9C27B0'
    },
    'Drizzle': {
        image: 'img/character_rain.png', 
        comment: (city) => `${city}は小雨が降っているよ。`,
        bgColor: '#B3E5FC',
        borderColor: '#2196F3'
    }
};


// ====================================================================
// ★★★ アニメーション機能 ★★★
// ====================================================================

function triggerCharacterAnimation(targetElement) {
    const element = targetElement || characterImg;

    element.classList.remove('animate');
    // リフローを強制してアニメーションをリセット
    element.offsetHeight; 
    element.classList.add('animate');

    setTimeout(() => {
            element.classList.remove('animate');
        }
        , 510);
}

characterImg.addEventListener('click', () => triggerCharacterAnimation(characterImg));

// ====================================================================
// ★★★ イベントリスナーと画面遷移 ★★★
// ====================================================================

startBtn.addEventListener('click', () => {
        const enteredCity = cityInputStart.value.trim();

        if (!enteredCity) {
            alert("検索したい都市名を入力してください。");
            return;
        }

        startBtn.disabled = true;

        startPage.classList.add('hidden');
        mainContent.classList.remove('hidden');

        // BGMがON設定であれば再生を試みる (ユーザー操作)
        if (isBGMPlaying && audioCtx.state !== 'running') {
            startBGM();
        }

        cityInput.value = enteredCity;

        getWeather(enteredCity).finally(() => {
                startBtn.disabled = false;
            });
    });

currentLocationBtn.addEventListener('click', () => {

        // BGMがON設定であれば再生を試みる (ユーザー操作)
        if (isBGMPlaying && audioCtx.state !== 'running') {
            startBGM();
        }

        getCurrentLocationWeather();
    });

backToStartBtn.addEventListener('click', () => {
        mainContent.classList.add('hidden');
        startPage.classList.remove('hidden');
        cityInputStart.value = '';
        cityInputStart.focus();
        closeAllLists();
    });

getWeatherBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();

        if (city) {
            getWeather(city);
        }

        else {
            alert('都市名を入力してください。');
        }
    });

cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getWeatherBtn.click();
        }
    });


// ====================================================================
// ★★★ 現在地検索機能 (Geolocation) ★★★
// ====================================================================

function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        alert("お使いのブラウザは現在地情報に対応していません。都市名を入力してください。");
        return;
    }

    setLoading(true);
    startPage.classList.add('hidden');
    mainContent.classList.remove('hidden');

    characterComment.innerHTML = `位置情報を取得中だよ...`;

    navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoords(lat, lon);
        }
        ,
        error => {
            setLoading(false);
            handleGeoError(error);
        }
        ,
        {
        enableHighAccuracy: true, timeout: 5000, maximumAge: 0
    });
}

function handleGeoError(error) {
    let message = '現在地の取得に失敗しました。';

    if (error.code === error.PERMISSION_DENIED) {
        message = 'ブラウザで位置情報の利用が許可されていません。設定を確認してください。';
    }

    else if (error.code === error.POSITION_UNAVAILABLE) {
        message = '位置情報が利用できません。';
    }

    else if (error.code === error.TIMEOUT) {
        message = '位置情報の取得がタイムアウトしました。';
    }

    alert(message);

    const errorBgColor = '#FFCDD2';
    const errorBorderColor = '#FFCDD2';

    characterComment.innerHTML = `ごめんね。${message}`;

    characterComment.style.background = errorBgColor;
    characterArea.style.setProperty('--comment-bg-color', errorBgColor);
    characterArea.style.setProperty('--icon-border-color', errorBorderColor);

    mainContent.classList.add('hidden');
    startPage.classList.remove('hidden');
}

/**
 * テンプレートリテラルの構文エラーを修正済み
 */
async function getWeatherByCoords(lat, lon) {
    const currentUrl = `${CURRENT_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;

    const forecastUrl = `${FORECAST_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;

    if (weatherHeaderDisplay) weatherHeaderDisplay.innerHTML = '';
    weatherDisplay.innerHTML = `<p>位置情報から天気情報を取得中...</p>`;

    try {
        const [currentResponse, forecastResponse] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error(`天気APIエラー`);
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        const finalDisplayCityName = currentData.name || "現在地";

        cityInput.value = finalDisplayCityName;

        displayWeather(currentData, finalDisplayCityName);
        displayForecast(forecastData, finalDisplayCityName);

    }

    catch (error) {
        handleError("現在地", error.message);
    }

    finally {
        setLoading(false);
    }
}


// ====================================================================
// ★★★ 都市名から天気取得 (メインロジック) ★★★
// ====================================================================

async function getWeather(city) {
    setLoading(true);
    closeAllLists();

    if (weatherHeaderDisplay) weatherHeaderDisplay.innerHTML = '';
    weatherDisplay.innerHTML = `<p>天気情報を取得中...</p>`;

    if (forecastDisplay) {
        forecastDisplay.innerHTML = `<p>週間予報を読み込み中...</p>`;
    }

    characterComment.innerHTML = `ちょっと待ってね...`;

    let displayCityName = city.trim();
    let searchCity = city;
    let normalizedCity = displayCityName.replace(/[\s]+/g, '');
    let isCityMapped = false;

    if (CITY_NAME_MAP[normalizedCity]) {
        searchCity = CITY_NAME_MAP[normalizedCity];
        displayCityName = normalizedCity;
        isCityMapped = true;
    }

    else {
        searchCity = city;
    }

    const currentUrl = `${CURRENT_BASE_URL}?q=${searchCity}&appid=${API_KEY}&units=metric&lang=ja`;

    const forecastUrl = `${FORECAST_BASE_URL}?q=${searchCity}&appid=${API_KEY}&units=metric&lang=ja`;

    try {
        const [currentResponse, forecastResponse] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            const errorData = await currentResponse.json();
            throw new Error(errorData.message || `HTTPエラー`);
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        let finalDisplayCityName = isCityMapped ? displayCityName : currentData.name;

        displayWeather(currentData, finalDisplayCityName);
        displayForecast(forecastData, finalDisplayCityName);

    }

    catch (error) {
        handleError(displayCityName, error.message);
    }

    finally {
        setLoading(false);
    }
}

/**
 * テンプレートリテラルの構文エラーを修正済み
 */
function displayWeather(data, displayCityName) {
    const cityName = displayCityName;
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const mainWeather = data.weather[0].main;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;

    const sunriseTimestamp = data.sys.sunrise * 1000;
    const sunsetTimestamp = data.sys.sunset * 1000;
    const dataTimestamp = data.dt * 1000;

    const options = {
        hour: '2-digit', minute: '2-digit', hour12: false
    };
    const sunriseTime = new Date(sunriseTimestamp).toLocaleTimeString('ja-JP', options);
    const sunsetTime = new Date(sunsetTimestamp).toLocaleTimeString('ja-JP', options);
    const dataTime = new Date(dataTimestamp).toLocaleTimeString('ja-JP', options);

    // ★★★ 霧/大気対応済みロジック ★★★
    const charData = weatherMap[mainWeather] || {
        image: 'img/luck.png',
        comment: (city) => `${description}なんだって。どんな一日になるかな！？`,
        bgColor: '#f5ffcdff',
        borderColor: '#f5ffcdff'
    };

    const bgColor = charData.bgColor;
    const borderColor = charData.borderColor;

    characterImg.src = charData.image;
    characterComment.innerHTML = charData.comment(cityName);

    characterComment.style.background = bgColor;
    characterArea.style.setProperty('--comment-bg-color', bgColor);
    characterArea.style.setProperty('--icon-border-color', borderColor);

    triggerCharacterAnimation(characterImg);

    // ハイフン付きの日付を挿入
    const todayDate = getFormattedTodayDate();

    // ヘッダーHTMLの構築 (CSSでレイアウトを整えるためのタグ構造)
    const headerHtml = ` 
        <h2>${cityName}の現在の天気</h2>
        <span class="current-date-info">${todayDate}</span>
    `;

    if (weatherHeaderDisplay) {
        weatherHeaderDisplay.innerHTML = headerHtml;
    }

    const weatherHtml = ` 
        <p>🌡️ 現在の気温: <strong>${temp}℃</strong></p>
        <p>✨ 詳しい天気: <strong>${description}</strong></p>
        <p>💧 湿度: <strong>${humidity}%</strong></p>
        <p>💨 風速: <strong>${windSpeed}m/s</strong></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
        <p>🌅 日の出: <strong>${sunriseTime}</strong>/ 🌇 日の入り: <strong>${sunsetTime}</strong></p>
        <p style="font-size: 0.8em; color: #888;">データ取得時刻: ${dataTime}</p>
    `;

    weatherDisplay.innerHTML = weatherHtml;
}


function displayForecast(data, displayCityName) {
    if (!forecastDisplay) return;

    const dailyForecast = {};
    const today = new Date().toLocaleDateString();

    data.list.forEach(item => {
            const date = new Date(item.dt_txt).toLocaleDateString();

            if (date === today) return;

            if (!dailyForecast[date]) {
                dailyForecast[date] = {
                    temp_max: -Infinity,
                    temp_min: Infinity,
                    weather_main: item.weather[0].main,
                    dt: item.dt
                };
            }

            dailyForecast[date].temp_max = Math.max(dailyForecast[date].temp_max, item.main.temp_max);
            dailyForecast[date].temp_min = Math.min(dailyForecast[date].temp_min, item.main.temp_min);
        });

    forecastDisplay.innerHTML = '';
    let forecastHtml = '';
    // 5日間 (API仕様上、今日を除いた次の5日分)
    const forecastDates = Object.keys(dailyForecast).slice(0, 5);

    forecastDates.forEach((dateKey, index) => {
        const item = dailyForecast[dateKey];
        const date = new Date(item.dt * 1000);

        const dayOfWeek = date.toLocaleDateString('ja-JP', {
            weekday: 'short'
        });

        const monthDay = date.toLocaleDateString('ja-JP', {
            month: 'numeric', day: 'numeric'
        });

        const weatherMain = item.weather_main;
        let iconSymbol = '❓';

        if (weatherMain.includes('Clear')) iconSymbol = '☀️';
        else if (weatherMain.includes('Clouds')) iconSymbol = '☁️';
        else if (weatherMain.includes('Rain') || weatherMain.includes('Drizzle') || weatherMain.includes('Squall')) iconSymbol = '☔';
        else if (weatherMain.includes('Snow')) iconSymbol = '☃️';
        else if (weatherMain.includes('Thunderstorm') || weatherMain.includes('Tornado')) iconSymbol = '⚡';
        // ★★★ 霧/大気対応済み ★★★
        else if (weatherMain.includes('Mist') || weatherMain.includes('Fog') || weatherMain.includes('Haze') || weatherMain.includes('Smoke') || weatherMain.includes('Dust') || weatherMain.includes('Sand') || weatherMain.includes('Ash')) iconSymbol = '🌫️';

        forecastHtml += ` 
            <div class="forecast-item" id="forecast-item-${index}" >
                <p class="item-date"><strong>${monthDay}(${dayOfWeek})</strong></p>
                <p class="item-icon" style="font-size: 1.5rem;">${iconSymbol}</p>
                <p class="item-temp"><span class="day-temp">${Math.round(item.temp_max)}℃</span> / <span class="night-temp">${Math.round(item.temp_min)}℃</span></p>
            </div> 
        `;
    });

    forecastDisplay.innerHTML = forecastHtml || `<p>週間予報のデータが見つかりませんでした。</p>`;

    forecastDates.forEach((_, index) => {
        const forecastItem = document.getElementById(`forecast-item-${index}`);

        if (forecastItem) {
            forecastItem.style.cursor = 'pointer';

            forecastItem.addEventListener('click', () => {
                    triggerCharacterAnimation(forecastItem);
                });
        }
    });
}

function handleError(displayCityName, message) {
    if (weatherHeaderDisplay) weatherHeaderDisplay.innerHTML = '';

    weatherDisplay.innerHTML = `<p style="color: red;">エラーが発生しました: ${displayCityName}の天気情報を取得できませんでした。</p>`;

    characterImg.src = 'img/Q1.png';

    let commentText = '';

    if (message && (message.includes('not found') || message.includes('city'))) {
        commentText = `あれれ？ "${displayCityName}" という場所は見つからなかったよ。入力が正しいか確認してみてね！`;
    }

    else if (message && message.includes('401')) {
        commentText = `⚠️ APIキーが無効か期限切れの可能性があります。`;
    }

    else {
        commentText = `ごめん、データを取得中に予期せぬエラーが起きたみたい。`;
    }

    const errorBgColor = '#FFCDD2';
    const errorBorderColor = '#FFCDD2';

    characterComment.innerHTML = commentText;

    characterComment.style.background = errorBgColor;
    characterArea.style.setProperty('--comment-bg-color', errorBgColor);
    characterArea.style.setProperty('--icon-border-color', errorBorderColor);

    if (forecastDisplay) {
        forecastDisplay.innerHTML = `<p style="color: red;">週間予報の取得に失敗しました。</p>`;
    }
}

// ====================================================================
// ★★★ オートコンプリート機能の実装 (共通化) ★★★
// ====================================================================

function closeAllLists() {
    if (autocompleteList) {
        // スタート画面の入力に対するオートコンプリートも、このリストを使用するため、
        // メイン画面とスタート画面の入力フィールドからリストが見えないよう設定する
        autocompleteList.classList.add('hidden'); 
        while (autocompleteList.firstChild) {
            autocompleteList.removeChild(autocompleteList.firstChild);
        }
    }
}

// ====================================================================
// ★★★ setupAutocomplete 関数 (部分一致検索に対応) ★★★
// ====================================================================
function setupAutocomplete(inputElement, triggerElement) {
    inputElement.addEventListener('input', function() {
            const inputValue = this.value.trim();
            closeAllLists();

            if (!inputValue) {
                return false;
            }

            const cityKeys = Object.keys(CITY_NAME_MAP);
            let matchCount = 0;
            const MAX_CANDIDATES = 10;
            const upperVal = inputValue.toUpperCase();

            // リストを再表示
            autocompleteList.classList.remove('hidden');
            autocompleteList.innerHTML = '';

            
            for (let i = 0; i < cityKeys.length && matchCount < MAX_CANDIDATES; i++) {
                const cityKey = cityKeys[i];
                const upperKey = cityKey.toUpperCase();

                // 部分一致チェック: cityKey（都市名や県名）が入力値を含むか
                if (upperKey.includes(upperVal)) {

                    let itemDiv = document.createElement("DIV");
                    itemDiv.setAttribute("class", "autocomplete-item");

                    // 一致部分を太字にするために、一致開始位置と長さを計算
                    const startIndex = upperKey.indexOf(upperVal);
                    const matchPart = cityKey.substring(startIndex, startIndex + inputValue.length);

                    // 候補の表示を構成
                    itemDiv.innerHTML = cityKey.substring(0, startIndex);
                    itemDiv.innerHTML += "<strong>" + matchPart + "</strong>";
                    itemDiv.innerHTML += cityKey.substring(startIndex + inputValue.length);

                    // 隠しフィールドには、オートコンプリートで選ばれた日本語名を入れる
                    itemDiv.innerHTML += "<input type='hidden' value='" + cityKey + "'>";

                    itemDiv.addEventListener("click", function() {
                            inputElement.value = this.getElementsByTagName("input")[0].value;
                            closeAllLists();

                            if (triggerElement) {
                                triggerElement.click();
                            }
                        });
                    autocompleteList.appendChild(itemDiv);
                    matchCount++;
                }
            }

            if (matchCount === 0) {
                autocompleteList.classList.add('hidden');
            }
        });

    inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                closeAllLists();

                if (triggerElement) {
                    triggerElement.click();
                }
            }
        });
}

document.addEventListener("click", function (e) {
        if (e.target !== cityInput && e.target !== cityInputStart && e.target.closest('#autocomplete-list') === null) {
            closeAllLists();
        }
    });

// ====================================================================
// ★★★ オートコンプリート機能 ★★★
// ====================================================================

setupAutocomplete(cityInputStart, startBtn);
setupAutocomplete(cityInput, getWeatherBtn);