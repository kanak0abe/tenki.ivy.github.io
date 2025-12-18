// ====================================================================
// ★★★ DOM要素の取得 ★★★
// ====================================================================
const startPage = document.getElementById('start-page');
const mainContent = document.getElementById('main-content');
const startWelcomeTitle = document.getElementById('start-welcome-title');
const startBtn = document.getElementById('start-btn');
const backToStartBtn = document.getElementById('back-to-start-btn');

const cityInputStart = document.getElementById('city-input-start');
const currentLocationBtn = document.getElementById('current-location-btn');

const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather-btn');
const weatherDisplay = document.getElementById('weather-display');
const weatherHeaderDisplay = document.getElementById('weather-header-display');
const characterImg = document.getElementById('character-img');
const characterComment = document.getElementById('character-comment');
const characterArea = document.querySelector('.character-area');
const forecastDisplay = document.getElementById('forecast-display');
const loadingOverlay = document.getElementById('loading-overlay');
const bgmToggleBtn = document.getElementById('bgm-toggle-btn');

// ====================================================================
// ★★★ BGM 制御ロジック ★★★
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
    } else {
        startBGM();
        localStorage.setItem('bgmState', 'on');
        updateBGMButton(true);
    }
}

function updateBGMButton(isPlaying) {
    if (isPlaying) {
        bgmToggleBtn.innerHTML = 'BGM: ON 🔈';
        bgmToggleBtn.classList.remove('off');
    } else {
        bgmToggleBtn.innerHTML = 'BGM: OFF 🔇';
        bgmToggleBtn.classList.add('off');
    }
}

bgmToggleBtn.addEventListener('click', toggleBGM);

document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('bgmState');
    isBGMPlaying = (savedState !== 'off');
    updateBGMButton(isBGMPlaying);
});

// ====================================================================
// ★★★ ユーティリティ/定数 ★★★
// ====================================================================
const API_KEY = 'b805c0aa4bdcc94949925b79c2c4d405';
const CURRENT_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

function setLoading(isLoading) {
    if (isLoading) {
        loadingOverlay.classList.remove('hidden');
        getWeatherBtn.disabled = true;
    } else {
        loadingOverlay.classList.add('hidden');
        getWeatherBtn.disabled = false;
    }
}

function getFormattedTodayDate() {
    const today = new Date();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `- ${today.getMonth() + 1}月${today.getDate()}日(${weekdays[today.getDay()]})`;
}

// ====================================================================
// ★★★ CITY_NAME_MAP ★★★
// ====================================================================
const CITY_NAME_MAP = {
    '札幌': 'Sapporo', '北海道': 'Sapporo', '旭川': 'Asahikawa', '函館': 'Hakodate', '帯広': 'Obihiro', '釧路': 'Kushiro', '小樽': 'Otaru', '苫小牧': 'Tomakomai', '室蘭': 'Muroran', '北見': 'Kitami', '網走': 'Abashiri', '稚内': 'Wakkanai',
    '青森': 'Aomori', '青森県': 'Aomori', '弘前': 'Hirosaki', '八戸': 'Hachinohe',
    '盛岡': 'Morioka', '岩手': 'Morioka', '岩手県': 'Morioka', '大船渡': 'Ofunato',
    '仙台': 'Sendai', '宮城': 'Sendai', '宮城県': 'Sendai', '石巻': 'Ishinomaki',
    '秋田': 'Akita', '秋田県': 'Akita', '横手': 'Yokote', '大館': 'Odate',
    '山形': 'Yamagata', '山形県': 'Yamagata', '米沢': 'Yonezawa', '鶴岡': 'Tsuruoka',
    '福島': 'Fukushima', '福島県': 'Fukushima', '郡山': 'Koriyama', 'いわき': 'Iwaki', '会津若松': 'Aizu-Wakamatsu',
    '水戸': 'Mito', '茨城': 'Mito', '茨城県': 'Mito', 'つくば': 'Tsukuba', '土浦': 'Tsuchiura',
    '宇都宮': 'Utsunomiya', '栃木': 'Utsunomiya', '栃木県': 'Utsunomiya', '日光': 'Nikko', '足利': 'Ashikaga',
    '前橋': 'Maebashi', '群馬': 'Maebashi', '群馬県': 'Maebashi', '高崎': 'Takasaki',
    'さいたま': 'Saitama', '埼玉': 'Saitama', '埼玉県': 'Saitama', '川越': 'Kawagoe', '熊谷': 'Kumagaya', '所沢': 'Tokorozawa', '越谷': 'Koshigaya', '川口': 'Kawaguchi', '春日部': 'Kasukabe',
    '千葉': 'Chiba', '千葉県': 'Chiba', '船橋': 'Funabashi', '柏': 'Kashiwa', '市川': 'Ichikawa', '松戸': 'Matsudo', '浦安': 'Urayasu', '成田': 'Narita',
    '東京': 'Tokyo', '東京都': 'Tokyo', '八王子': 'Hachioji', '町田': 'Machida', '立川': 'Tachikawa', '三鷹': 'Mitaka', '府中': 'Fuchu',
    '横浜': 'Yokohama', '神奈川': 'Yokohama', '神奈川県': 'Yokohama', '川崎': 'Kawasaki', '相模原': 'Sagamihara', '横須賀': 'Yokosuka', '藤沢': 'Fujisawa', '小田原': 'Odawara', '厚木': 'Atsugi', '茅ヶ崎': 'Chigasaki', '箱根': 'Hakone',
    '新潟': 'Niigata', '新潟県': 'Niigata', '長岡': 'Nagaoka', '上越': 'Joetsu',
    '富山': 'Toyama', '富山県': 'Toyama', '高岡': 'Takaoka',
    '金沢': 'Kanazawa', '石川': 'Kanazawa', '石川県': 'Kanazawa', '小松': 'Komatsu',
    '福井': 'Fukui', '福井県': 'Fukui', '敦賀': 'Tsuruga',
    '甲府': 'Kofu', '山梨': 'Kofu', '山梨県': 'Kofu', '富士吉田': 'Fujiyoshida',
    '長野': 'Nagano', '長野県': 'Nagano', '松本': 'Matsumoto', '軽井沢': 'Karuizawa', '諏訪': 'Suwa',
    '岐阜': 'Gifu', '岐阜県': 'Gifu', '大垣': 'Ogaki', '高山': 'Takayama',
    '静岡': 'Shizuoka', '静岡県': 'Shizuoka', '沼津': 'Numazu', '浜松': 'Hamamatsu', '熱海': 'Atami', '伊豆': 'Izu',
    '名古屋': 'Nagoya', '愛知': 'Nagoya', '愛知県': 'Nagoya', '豊田': 'Toyota', '岡崎': 'Okazaki', '豊橋': 'Toyohashi', '一宮': 'Ichinomiya', '春日井': 'Kasugai',
    '津': 'Tsu', '三重': 'Tsu', '三重県': 'Tsu', '四日市': 'Yokkaichi', '伊勢': 'Ise', '鳥羽': 'Toba',
    '大津': 'Otsu', '滋賀': 'Otsu', '滋賀県': 'Otsu', '彦根': 'Hikone',
    '京都': 'Kyoto', '京都府': 'Kyoto', '福知山': 'Fukuchiyama',
    '大阪': 'Osaka', '大阪府': 'Osaka', '枚方': 'Hirakata', '堺': 'Sakai', '東大阪': 'Higashiosaka', '高槻': 'Takatsuki', '豊中': 'Toyonaka',
    '神戸': 'Kobe', '兵庫': 'Kobe', '兵庫県': 'Kobe', '姫路': 'Himeji', '西宮': 'Nishinomiya', '明石': 'Akashi', '尼崎': 'Amagasaki',
    '奈良': 'Nara', '奈良県': 'Nara',
    '和歌山': 'Wakayama', '和歌山県': 'Wakayama',
    '鳥取': 'Tottori', '鳥取県': 'Tottori', '米子': 'Yonago',
    '松江': 'Matsue', '島根': 'Matsue', '島根県': 'Matsue', '出雲': 'Izumo',
    '岡山': 'Okayama', '岡山県': 'Okayama', '倉敷': 'Kurashiki',
    '広島': 'Hiroshima', '広島県': 'Hiroshima', '福山': 'Fukuyama', '呉': 'Kure', '尾道': 'Onomichi',
    '山口': 'Yamaguchi', '山口県': 'Yamaguchi', '下関': 'Shimonoseki',
    '徳島': 'Tokushima', '徳島県': 'Tokushima', '鳴門': 'Naruto',
    '高松': 'Takamatsu', '香川': 'Takamatsu', '香川県': 'Takamatsu',
    '松山': 'Matsuyama', '愛媛': 'Matsuyama', '愛媛県': 'Matsuyama', '今治': 'Imabari',
    '高知': 'Kochi', '高知県': 'Kochi',
    '福岡': 'Fukuoka', '福岡県': 'Fukuoka', '北九州': 'Kitakyushu', '久留米': 'Kurume', '大牟田': 'Omuta',
    '佐賀': 'Saga', '佐賀県': 'Saga', '唐津': 'Karatsu',
    '長崎': 'Nagasaki', '長崎県': 'Nagasaki', '佐世保': 'Sasebo',
    '熊本': 'Kumamoto', '熊本県': 'Kumamoto', '阿蘇': 'Aso',
    '大分': 'Oita', '大分市': 'Oita', '別府': 'Beppu', '中津': 'Nakatsu', '日田': 'Hita', '佐伯': 'Saiki', '臼杵': 'Usuki', '津久見': 'Tsukumi', '竹田': 'Taketa', '豊後高田': 'Bungo-Takada', '杵築': 'Kitsuki', '宇佐': 'Usa', '豊後大野': 'Bungo-ono', '由布': 'Yufu', '国東': 'Kunisaki', '日出': 'Hiji', '玖珠': 'Kusu', '九重': 'Kokonoe',
    '宮崎': 'Miyazaki', '宮崎県': 'Miyazaki', '延岡': 'Nobeoka', '都城': 'Miyakonojo',
    '鹿児島': 'Kagoshima', '鹿児島県': 'Kagoshima', '奄美': 'Amami', '種子島': 'Tanegashima',
    '那覇': 'Naha', '沖縄': 'Naha', '沖縄県': 'Naha', '宮古島': 'Miyakojima', '石垣島': 'Ishigaki',
    '舞浜': 'Urayasu', 'ディズニー': 'Urayasu', 'ユニバ': 'Osaka', 'USJ': 'Osaka', 'ハウステンボス': 'Sasebo',
    '白川郷': 'Ono', '屋久島': 'Yakushima', '宮島': 'Hatsukaichi', '厳島神社': 'Hatsukaichi',
    '知床': 'Shari', '直島': 'Naoshima', '美瑛': 'Biei', '富良野': 'Furano', '草津': 'Kusatsu', '名護': 'Nago',
    'ハワイ': 'Honolulu', 'ホノルル': 'Honolulu', 'ワイキキ': 'Honolulu',
    'グアム': 'Guam', 'サイパン': 'Saipan',
    'タヒチ': 'Papeete', 'バリ島': 'Bali', 'プーケット': 'Phuket',
    'セブ': 'Cebu', 'セブ島': 'Cebu', 'ボラカイ': 'Boracay', 'ダナン': 'Da Nang',
    'ニャチャン': 'Nha Trang', 'モルディブ': 'Male', 'フィジー': 'Suva', 'カンクン': 'Cancun',
    'ウユニ': 'Uyuni', 'マチュピチュ': 'Machu Picchu', 'ギザ': 'Giza', 'ピラミッド': 'Giza',
    'ロバニエミ': 'Rovaniemi', 'イエローナイフ': 'Yellowknife', 'レイキャビク': 'Reykjavik',
    'モンサンミッシェル': 'Pontorson', 'サントリーニ': 'Thira', 'イビザ': 'Ibiza',
    'ニューヨーク': 'New York', 'ロサンゼルス': 'Los Angeles', 'サンフランシスコ': 'San Francisco',
    'ラスベガス': 'Las Vegas', 'シアトル': 'Seattle', 'ボストン': 'Boston', 'シカゴ': 'Chicago',
    'オーランド': 'Orlando', 'アナハイム': 'Anaheim', 'バンクーバー': 'Vancouver', 'トロント': 'Toronto',
    'メキシコシティ': 'Mexico City', 'リオデジャネイロ': 'Rio de Janeiro', 'ブエノスアイレス': 'Buenos Aires',
    'パリ': 'Paris', 'ニース': 'Nice', 'ロンドン': 'London', 'エディンバラ': 'Edinburgh',
    'ローマ': 'Rome', 'フィレンツェ': 'Florence', 'ヴェネツィア': 'Venice', 'ミラノ': 'Milan',
    'バルセロナ': 'Barcelona', 'マドリード': 'Madrid', 'ミュンヘン': 'Munich', 'フランクフルト': 'Frankfurt',
    'ベルリン': 'Berlin', 'ウィーン': 'Vienna', 'ザルツブルグ': 'Salzburg', 'プラハ': 'Prague',
    'アムステルダム': 'Amsterdam', 'ブリュッセル': 'Brussels', 'チューリッヒ': 'Zurich',
    'アテネ': 'Athens', 'イスタンブール': 'Istanbul',
    'ソウル': 'Seoul', '釜山': 'Busan', '済州島': 'Jeju City',
    '台北': 'Taipei', '九份': 'New Taipei City', '高雄': 'Kaohsiung',
    '香港': 'Hong Kong', 'マカオ': 'Macau', 'バンコク': 'Bangkok', 'チェンマイ': 'Chiang Mai',
    'シンガポール': 'Singapore', 'クアラルンプール': 'Kuala Lumpur', 'ホーチミン': 'Ho Chi Minh City', 'ハノイ': 'Hanoi',
    'マニラ': 'Manila', 'ジャカルタ': 'Jakarta', 'プノンペン': 'Phnom Penh', 'ビエンチャン': 'Vientiane',
    'シドニー': 'Sydney', 'メルボルン': 'Melbourne', 'ケアンズ': 'Cairns', 'ゴールドコースト': 'Gold Coast',
    'オークランド': 'Auckland', 'クイーンズタウン': 'Queenstown',
    'ドバイ': 'Dubai', 'アブダビ': 'Abu Dhabi', 'カイロ': 'Cairo',
    'カサブランカ': 'Casablanca', 'ケープタウン': 'Cape Town'
};

// ====================================================================
// ★★★ キャラクター定義 ★★★
// ====================================================================
const weatherMap = {
    'Clear': { image: 'img/character_clear.png', comment: (city) => `${city}は「快晴」お出かけ日和だね！☀️`, bgColor: '#FFE0B2', borderColor: '#FFC107' },
    'Clouds': { image: 'img/character_clouds.png', comment: (city) => `${city}は「曇り」だよ。<br>念のため、傘を持っていこう☁️`, bgColor: '#E0E0E0', borderColor: '#9E9E9E' },
    'Rain': { image: 'img/character_rain.png', comment: (city) => `${city}は「雨」が降っているよ。<br>濡れないように気をつけてね☔️`, bgColor: '#B3E5FC', borderColor: '#2196F3' },
    'Mist': { image: 'img/character_kiri.png', comment: (city) => `${city}は「霧が」出てるみたい。<br>運転や足元に注意だよ！`, bgColor: '#E0E0E0', borderColor: '#9E9E9E' },
    'Fog': { image: 'img/character_noumu.png', comment: (city) => `${city}は「濃い霧」だよ。<br>運転や足元に注意してね！`, bgColor: '#E0E0E0', borderColor: '#9E9E9E' },
    'Haze': { image: 'img/character_cloudsmoya.png', comment: (city) => `${city}は「もや」がかかっているよ。<br>視界に気をつけてね！`, bgColor: '#E0E0E0', borderColor: '#9E9E9E' },
    'Snow': { image: 'img/character_snow.png', comment: (city) => `${city}は「雪」積もるかな？<br>あったかくしてね！☃️`, bgColor: '#E3F2FD', borderColor: '#00BCD4' },
    'Thunderstorm': { image: 'img/character_raiu.png', comment: (city) => `${city}は「雷雨」の予報！<br>気をつけてね⚡️`, bgColor: '#B3E5FC', borderColor: '#9C27B0' },
    'Drizzle': { image: 'img/character_rains.png', comment: (city) => `${city}は「小雨」が降っているよ。<br>お気に入りの傘を持って出かけよう！`, bgColor: '#B3E5FC', borderColor: '#2196F3' }
};

// ====================================================================
// ★★★ アニメーション ★★★
// ====================================================================
function triggerCharacterAnimation(targetElement) {
    targetElement.classList.remove('animate');
    targetElement.offsetHeight; // reflow
    targetElement.classList.add('animate');
    setTimeout(() => targetElement.classList.remove('animate'), 510);
}
characterImg.addEventListener('click', () => triggerCharacterAnimation(characterImg));

// ====================================================================
// ★★★ イベントリスナー ★★★
// ====================================================================
startBtn.addEventListener('click', () => {
    const enteredCity = cityInputStart.value.trim();
    if (!enteredCity) { alert("検索したい都市名を入力してください。"); return; }
    startBtn.disabled = true;
    startWelcomeTitle.classList.add('hidden');
    startPage.classList.add('hidden');
    mainContent.classList.remove('hidden');
    if (isBGMPlaying && audioCtx.state !== 'running') startBGM();
    cityInput.value = enteredCity;
    getWeather(enteredCity).finally(() => startBtn.disabled = false);
});

currentLocationBtn.addEventListener('click', () => {
    startWelcomeTitle.classList.add('hidden');
    if (isBGMPlaying && audioCtx.state !== 'running') startBGM();
    getCurrentLocationWeather();
});

backToStartBtn.addEventListener('click', () => {
    startWelcomeTitle.classList.remove('hidden');
    mainContent.classList.add('hidden');
    startPage.classList.remove('hidden');
    cityInputStart.value = '';
    cityInputStart.focus();
    closeAllLists();
});

getWeatherBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city); else alert('都市名を入力してください。');
});

cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') getWeatherBtn.click(); });

// ====================================================================
// ★★★ 位置情報検索 ★★★
// ====================================================================
function getCurrentLocationWeather() {
    if (!navigator.geolocation) { alert("非対応ブラウザです"); return; }
    setLoading(true);
    startPage.classList.add('hidden');
    mainContent.classList.remove('hidden');
    characterComment.innerHTML = `位置情報を取得中だよ...`;
    navigator.geolocation.getCurrentPosition(
        pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        err => { setLoading(false); handleGeoError(err); },
        { enableHighAccuracy: true, timeout: 5000 }
    );
}

function handleGeoError(error) {
    alert('位置情報の取得に失敗しました。');
    mainContent.classList.add('hidden');
    startPage.classList.remove('hidden');
    startWelcomeTitle.classList.remove('hidden');
}

async function getWeatherByCoords(lat, lon) {
    const currentUrl = `${CURRENT_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;
    const forecastUrl = `${FORECAST_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;
    try {
        const [currRes, foreRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
        const currData = await currRes.json();
        const foreData = await foreRes.json();
        const name = currData.name || "現在地";
        cityInput.value = name;
        displayWeather(currData, name);
        displayForecast(foreData, name);
    } catch (e) { handleError("現在地", e.message); }
    finally { setLoading(false); }
}

// ====================================================================
// ★★★ 天気取得メイン ★★★
// ====================================================================
async function getWeather(city) {
    setLoading(true);
    closeAllLists();
    characterComment.innerHTML = `ちょっと待ってね...`;
    let displayCityName = city.trim();
    let searchCity = CITY_NAME_MAP[displayCityName] || displayCityName;
    const currentUrl = `${CURRENT_BASE_URL}?q=${searchCity}&appid=${API_KEY}&units=metric&lang=ja`;
    const forecastUrl = `${FORECAST_BASE_URL}?q=${searchCity}&appid=${API_KEY}&units=metric&lang=ja`;
    try {
        const [currRes, foreRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
        if (!currRes.ok) throw new Error("City not found");
        const currData = await currRes.json();
        const foreData = await foreRes.json();
        displayWeather(currData, displayCityName);
        displayForecast(foreData, displayCityName);
    } catch (e) { handleError(displayCityName, e.message); }
    finally { setLoading(false); }
}

function displayWeather(data, displayCityName) {
    const charData = weatherMap[data.weather[0].main] || { image: 'img/Q1.png', comment: (c) => `天気は${data.weather[0].description}だよ！`, bgColor: '#f5ffcd', borderColor: '#f5ffcd' };
    characterImg.src = charData.image;
    characterComment.innerHTML = charData.comment(displayCityName);
    characterComment.style.background = charData.bgColor;
    characterArea.style.setProperty('--comment-bg-color', charData.bgColor);
    characterArea.style.setProperty('--icon-border-color', charData.borderColor);
    triggerCharacterAnimation(characterImg);

    weatherHeaderDisplay.innerHTML = `<h2 class="weather-title"><span class="city-name-large">${displayCityName}</span>の天気</h2><span class="current-date-info">${getFormattedTodayDate()}</span>`;
    weatherDisplay.innerHTML = `<p>🌡️ 気温: <strong>${Math.round(data.main.temp)}℃</strong></p><p>✨ 天気: <strong>${data.weather[0].description}</strong></p><p>💧 湿度: <strong>${data.main.humidity}%</strong></p>`;
}

function displayForecast(data, displayCityName) {
    const daily = {};
    const today = new Date().toLocaleDateString();
    data.list.forEach(item => {
        const date = new Date(item.dt_txt).toLocaleDateString();
        if (date === today) return;
        if (!daily[date]) daily[date] = { max: -Infinity, min: Infinity, main: item.weather[0].main, dt: item.dt };
        daily[date].max = Math.max(daily[date].max, item.main.temp_max);
        daily[date].min = Math.min(daily[date].min, item.main.temp_min);
    });
    let html = '';
    Object.keys(daily).slice(0, 5).forEach((key, i) => {
        const d = daily[key];
        const dateObj = new Date(d.dt * 1000);
        html += `<div class="forecast-item" id="forecast-item-${i}">
            <p><strong>${dateObj.getMonth()+1}/${dateObj.getDate()}</strong></p>
            <p style="font-size:1.5rem;">${d.main === 'Clear' ? '☀️' : '☁️'}</p>
            <p>${Math.round(d.max)}℃ / ${Math.round(d.min)}℃</p>
        </div>`;
    });
    forecastDisplay.innerHTML = html;
}

function handleError(name, msg) {
    characterComment.innerHTML = `"${name}" が見つからなかったよ。`;
    weatherDisplay.innerHTML = `<p style="color:red;">エラーが発生しました。</p>`;
}

// ====================================================================
// ★★★ オートコンプリート (五十音順対応版) ★★★
// ====================================================================
function closeAllLists() {
    document.querySelectorAll('.autocomplete-list').forEach(l => { l.classList.add('hidden'); l.innerHTML = ''; });
}

function handleInputCustom(inputElement, listId) {
    const val = inputElement.value.trim().toLowerCase();
    const targetList = document.getElementById(listId);
    targetList.innerHTML = '';
    targetList.classList.add('hidden');
    if (!val) return;

    // ★★★ 五十音順（localeCompare）でソート ★★★
    const matchedCities = Object.keys(CITY_NAME_MAP)
        .filter(city => city.toLowerCase().startsWith(val))
        .sort((a, b) => a.localeCompare(b, 'ja')) // あいうえお順に並び替え
        .slice(0, 15);

    if (matchedCities.length > 0) {
        matchedCities.forEach(city => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            const index = city.toLowerCase().indexOf(val);
            item.innerHTML = `<strong>${city.substring(index, index + val.length)}</strong>${city.substring(index + val.length)}`;
            item.addEventListener('click', () => {
                inputElement.value = city;
                closeAllLists();
                if (inputElement.id === 'city-input-start') startBtn.click(); else getWeatherBtn.click();
            });
            targetList.appendChild(item);
        });
        targetList.classList.remove('hidden');
    }
}

cityInputStart.addEventListener('input', () => handleInputCustom(cityInputStart, 'autocomplete-list-start'));
cityInput.addEventListener('input', () => handleInputCustom(cityInput, 'autocomplete-list'));

document.addEventListener("click", (e) => {
    if (!e.target.closest('.start-input-group') && !e.target.closest('.input-area')) closeAllLists();
});