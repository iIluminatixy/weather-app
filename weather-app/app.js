/* =========================================================
   WeatherGlass — app.js
   Open-Meteo (free, no key) + IP geolocation
   ========================================================= */

'use strict';

// ── State ──────────────────────────────────────────────────
const state = {
  unit: 'metric',       // 'metric' | 'imperial'
  currentCity: null,
  currentLat: null,
  currentLon: null,
  weather: null,
  savedLocations: JSON.parse(localStorage.getItem('wg-saved') || '[]'),
  theme: localStorage.getItem('wg-theme') || 'dark',
  chartMode: 'temp',
  hourlyData: null,
  dailyData: null,
  refreshTimer: null,
};

// ── DOM refs ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const dom = {
  cityInput: $('cityInput'),
  searchBtn: $('searchBtn'),
  suggestions: $('suggestions'),
  savedList: $('savedList'),
  unitBtns: document.querySelectorAll('.unit-btn'),
  heroDate: $('heroDate'),
  heroTemp: $('heroTemp'),
  heroUnit: $('heroUnit'),
  heroDesc: $('heroDesc'),
  heroFeels: $('heroFeels'),
  heroHigh: $('heroHigh'),
  heroLow: $('heroLow'),
  heroIcon: $('heroIcon'),
  aqiVal: $('aqiVal'),
  aqiDot: $('aqiDot'),
  aqiLabel: $('aqiLabel'),
  windVal: $('windVal'),
  windDir: $('windDir'),
  windGauge: $('windGauge'),
  humVal: $('humVal'),
  humDesc: $('humDesc'),
  humGauge: $('humGauge'),
  visVal: $('visVal'),
  pressureVal: $('pressureVal'),
  uvVal: $('uvVal'),
  uvDesc: $('uvDesc'),
  uvBar: $('uvBar'),
  sunriseVal: $('sunriseVal'),
  sunsetVal: $('sunsetVal'),
  sunDot: $('sunDot'),
  hourlyList: $('hourlyList'),
  hourlyChart: $('hourlyChart'),
  dailyGrid: $('dailyGrid'),
  refreshBtn: $('refreshBtn'),
  addSaveBtn: $('addSaveBtn'),
  themeBtn: $('themeBtn'),
  currentCityLabel: $('currentCityLabel'),
  mapCityLabel: $('mapCityLabel'),
  lastUpdated: $('lastUpdated'),
  bgScene: $('bgScene'),
  envList: $('envList'),
  toast: $('toast'),
  chartToggleBtns: document.querySelectorAll('.ct-btn'),
};

// ── WMO weather code → label + emoji ──────────────────────
const WMO = {
  0: { label: 'Clear Sky', emoji: '☀️', icon: 'clear' },
  1: { label: 'Mainly Clear', emoji: '🌤️', icon: 'partcloud' },
  2: { label: 'Partly Cloudy', emoji: '⛅', icon: 'partcloud' },
  3: { label: 'Overcast', emoji: '☁️', icon: 'cloudy' },
  45:{ label: 'Foggy', emoji: '🌫️', icon: 'fog' },
  48:{ label: 'Icy Fog', emoji: '🌫️', icon: 'fog' },
  51:{ label: 'Light Drizzle', emoji: '🌦️', icon: 'rain' },
  53:{ label: 'Drizzle', emoji: '🌧️', icon: 'rain' },
  55:{ label: 'Heavy Drizzle', emoji: '🌧️', icon: 'rain' },
  61:{ label: 'Slight Rain', emoji: '🌦️', icon: 'rain' },
  63:{ label: 'Rain', emoji: '🌧️', icon: 'rain' },
  65:{ label: 'Heavy Rain', emoji: '🌧️', icon: 'rain' },
  71:{ label: 'Slight Snow', emoji: '🌨️', icon: 'snow' },
  73:{ label: 'Snowfall', emoji: '❄️', icon: 'snow' },
  75:{ label: 'Heavy Snow', emoji: '❄️', icon: 'snow' },
  80:{ label: 'Rain Showers', emoji: '🌦️', icon: 'rain' },
  81:{ label: 'Rain Showers', emoji: '🌧️', icon: 'rain' },
  82:{ label: 'Violent Showers', emoji: '⛈️', icon: 'storm' },
  85:{ label: 'Snow Showers', emoji: '🌨️', icon: 'snow' },
  86:{ label: 'Heavy Snow Showers', emoji: '❄️', icon: 'snow' },
  95:{ label: 'Thunderstorm', emoji: '⛈️', icon: 'storm' },
  96:{ label: 'Thunderstorm w/ Hail', emoji: '⛈️', icon: 'storm' },
  99:{ label: 'Heavy Thunderstorm', emoji: '⛈️', icon: 'storm' },
};
const getWMO = code => WMO[code] || { label: 'Unknown', emoji: '🌡️', icon: 'clear' };

// ── Weather canvas animation ──────────────────────────────
class WeatherCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.type = 'clear';
    this.frame = 0;
    this.raf = null;
  }

  setType(type) {
    this.type = type;
    this.particles = [];
    this.buildParticles();
    if (!this.raf) this.loop();
  }

  buildParticles() {
    const w = this.canvas.width, h = this.canvas.height;
    if (this.type === 'rain') {
      for (let i = 0; i < 40; i++) this.particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vy: 3 + Math.random() * 3, vx: 1,
        len: 8 + Math.random() * 8,
        alpha: .3 + Math.random() * .4,
      });
    } else if (this.type === 'snow') {
      for (let i = 0; i < 30; i++) this.particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vy: .5 + Math.random() * 1, vx: Math.sin(i) * .5,
        r: 2 + Math.random() * 3, alpha: .4 + Math.random() * .4,
        phase: Math.random() * Math.PI * 2,
      });
    } else if (this.type === 'cloudy' || this.type === 'fog') {
      for (let i = 0; i < 5; i++) this.particles.push({
        x: Math.random() * w, y: 40 + Math.random() * 80,
        r: 30 + Math.random() * 40, alpha: .06 + Math.random() * .08,
        vx: .15 + Math.random() * .1,
      });
    }
  }

  loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    const { ctx, canvas: { width: w, height: h } } = this;
    ctx.clearRect(0, 0, w, h);
    this.frame++;

    if (this.type === 'clear') this.drawSun(w, h);
    else if (this.type === 'partcloud') { this.drawSun(w, h); this.drawClouds(w, h, .5); }
    else if (this.type === 'cloudy') this.drawClouds(w, h, .9);
    else if (this.type === 'fog') this.drawFog(w, h);
    else if (this.type === 'rain') { this.drawClouds(w, h, .8); this.drawRain(); }
    else if (this.type === 'snow') { this.drawClouds(w, h, .6); this.drawSnow(); }
    else if (this.type === 'storm') { this.drawClouds(w, h, .95); this.drawRain(); this.drawLightning(w, h); }
  }

  drawSun(w, h) {
    const cx = w / 2, cy = h / 2;
    const pulse = Math.sin(this.frame * .04) * 6;
    // glow rings
    for (let i = 3; i > 0; i--) {
      const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 + i * 18 + pulse);
      grad.addColorStop(0, `rgba(255,220,80,${.15 / i})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 30 + i * 18 + pulse, 0, Math.PI * 2);
      this.ctx.fill();
    }
    // core
    const grad = this.ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, 28);
    grad.addColorStop(0, '#FFF9C4');
    grad.addColorStop(.4, '#FFD740');
    grad.addColorStop(1, '#FF8F00');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    this.ctx.fill();
    // rays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.frame * .008;
      const x1 = cx + Math.cos(angle) * 34;
      const y1 = cy + Math.sin(angle) * 34;
      const x2 = cx + Math.cos(angle) * (42 + pulse);
      const y2 = cy + Math.sin(angle) * (42 + pulse);
      this.ctx.strokeStyle = 'rgba(255,220,80,.55)';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  drawClouds(w, h, opacity) {
    const t = this.frame * .003;
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    [[w*.4, h*.35, 50], [w*.55, h*.3, 38], [w*.45, h*.42, 32], [w*.65, h*.38, 28]].forEach(([cx, cy, r], i) => {
      const x = cx + Math.sin(t + i) * 4;
      const grad = this.ctx.createRadialGradient(x, cy - r*.2, r*.1, x, cy, r);
      grad.addColorStop(0, 'rgba(240,248,255,.9)');
      grad.addColorStop(1, 'rgba(180,210,240,.4)');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(x, cy, r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawFog(w, h) {
    for (let i = 0; i < 3; i++) {
      const y = h * (.3 + i * .15) + Math.sin(this.frame * .01 + i) * 5;
      const grad = this.ctx.createLinearGradient(0, y, w, y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(.3, `rgba(200,215,230,${.12 + i * .04})`);
      grad.addColorStop(.7, `rgba(200,215,230,${.12 + i * .04})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, y - 10, w, 20);
    }
  }

  drawRain() {
    this.particles.forEach(p => {
      p.y += p.vy; p.x += p.vx;
      if (p.y > this.canvas.height) { p.y = -p.len; p.x = Math.random() * this.canvas.width; }
      this.ctx.strokeStyle = `rgba(160,200,255,${p.alpha})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - p.vx * 2, p.y - p.len);
      this.ctx.stroke();
    });
  }

  drawSnow() {
    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(this.frame * .02 + p.phase) * .5;
      if (p.y > this.canvas.height) { p.y = -10; p.x = Math.random() * this.canvas.width; }
      this.ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawLightning(w, h) {
    if (this.frame % 90 < 3) {
      this.ctx.strokeStyle = 'rgba(200,220,255,.9)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      let x = w * .5 + (Math.random() - .5) * 60, y = h * .3;
      this.ctx.moveTo(x, y);
      while (y < h * .75) {
        x += (Math.random() - .5) * 30;
        y += 20 + Math.random() * 20;
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
  }

  destroy() { if (this.raf) cancelAnimationFrame(this.raf); }
}

let weatherAnim = null;

// ── Particle background ──────────────────────────────────
(function initParticles() {
  const canvas = $('particleCanvas');
  const ctx = canvas.getContext('2d');
  let pts = [];
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: .5 + Math.random() * 1.5,
      vx: (Math.random() - .5) * .2,
      vy: (Math.random() - .5) * .2,
      alpha: .1 + Math.random() * .3,
    }));
  };
  window.addEventListener('resize', resize);
  resize();

  const loop = () => {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.fill();
    });
    // connect nearby
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.strokeStyle = `rgba(255,255,255,${.04 * (1 - d / 120)})`;
          ctx.lineWidth = .5;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
  };
  loop();
})();

// ── Hourly Chart ─────────────────────────────────────────
function drawHourlyChart(data, mode) {
  const canvas = dom.hourlyChart;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement.offsetWidth;
  const h = 90;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const vals = mode === 'temp'
    ? data.hourly.temperature_2m.slice(0, 24)
    : data.hourly.precipitation_probability.slice(0, 24);

  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pad = { l: 10, r: 10, t: 10, b: 20 };
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;

  const getY = v => pad.t + ph - ((v - minV) / range) * ph;
  const getX = i => pad.l + (i / 23) * pw;

  // gradient fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  if (mode === 'temp') {
    grad.addColorStop(0, 'rgba(91,155,255,.35)');
    grad.addColorStop(1, 'rgba(91,155,255,.0)');
  } else {
    grad.addColorStop(0, 'rgba(96,165,250,.35)');
    grad.addColorStop(1, 'rgba(96,165,250,.0)');
  }

  ctx.beginPath();
  ctx.moveTo(getX(0), getY(vals[0]));
  for (let i = 1; i < vals.length; i++) {
    const cx = (getX(i - 1) + getX(i)) / 2;
    ctx.bezierCurveTo(cx, getY(vals[i - 1]), cx, getY(vals[i]), getX(i), getY(vals[i]));
  }
  ctx.lineTo(getX(23), h - pad.b);
  ctx.lineTo(getX(0), h - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(vals[0]));
  for (let i = 1; i < vals.length; i++) {
    const cx = (getX(i - 1) + getX(i)) / 2;
    ctx.bezierCurveTo(cx, getY(vals[i - 1]), cx, getY(vals[i]), getX(i), getY(vals[i]));
  }
  ctx.strokeStyle = mode === 'temp' ? 'rgba(91,155,255,.8)' : 'rgba(96,165,250,.8)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// ── Format helpers ───────────────────────────────────────
const fmtTemp = (c, unit) => unit === 'imperial' ? Math.round(c * 9/5 + 32) : Math.round(c);
const fmtWind = (ms, unit) => unit === 'imperial' ? `${Math.round(ms * 2.237)} mph` : `${Math.round(ms * 3.6)} km/h`;
const fmtTime = iso => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = iso => new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
const windDirStr = deg => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
};
const uvDesc = uv => {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
};
const humDesc = h => {
  if (h < 30) return 'Dry';
  if (h < 60) return 'Comfortable';
  if (h < 80) return 'Humid';
  return 'Very Humid';
};
const aqiInfo = aqi => {
  if (aqi <= 50) return { label: 'Good', color: '#4ade80' };
  if (aqi <= 100) return { label: 'Moderate', color: '#facc15' };
  if (aqi <= 150) return { label: 'Unhealthy for SG', color: '#fb923c' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
  return { label: 'Hazardous', color: '#9333ea' };
};

// ── Geocoding (Open-Meteo geocoding) ─────────────────────
async function geocode(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const r = await fetch(url);
  const d = await r.json();
  return d.results || [];
}

// ── IP geolocation fallback ──────────────────────────────
async function ipGeo() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    const d = await r.json();
    return { name: d.city || 'Your Location', lat: d.latitude, lon: d.longitude };
  } catch {
    return { name: 'London', lat: 51.5074, lon: -0.1278 };
  }
}

// ── Fetch weather from Open-Meteo ────────────────────────
async function fetchWeather(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', [
    'temperature_2m','apparent_temperature','weather_code',
    'wind_speed_10m','wind_direction_10m','relative_humidity_2m',
    'surface_pressure','visibility','uv_index',
  ].join(','));
  url.searchParams.set('hourly', [
    'temperature_2m','precipitation_probability','weather_code',
    'wind_speed_10m','relative_humidity_2m',
  ].join(','));
  url.searchParams.set('daily', [
    'weather_code','temperature_2m_max','temperature_2m_min',
    'sunrise','sunset','precipitation_probability_max','uv_index_max',
  ].join(','));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', 7);

  const r = await fetch(url);
  if (!r.ok) throw new Error('Weather API error');
  return r.json();
}

// ── Fetch AQI from Open-Meteo Air Quality ────────────────
async function fetchAQI(lat, lon) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&hourly=pm2_5,pm10`;
    const r = await fetch(url);
    const d = await r.json();
    return d.current || {};
  } catch { return {}; }
}

// ── Update background theme by weather ───────────────────
function setWeatherTheme(code) {
  const body = document.body;
  const icon = getWMO(code).icon;
  body.setAttribute('data-wx', icon);

  const themes = {
    clear:    ['#0f2744', '#1a4080', 'rgba(80,160,255,.6)', 'rgba(255,200,60,.3)'],
    partcloud:['#0f2744', '#1a3a60', 'rgba(60,120,220,.5)', 'rgba(180,160,255,.2)'],
    cloudy:   ['#1a1f2e', '#252c3d', 'rgba(80,100,140,.5)', 'rgba(140,160,200,.2)'],
    fog:      ['#1e2030', '#252835', 'rgba(100,110,140,.4)', 'rgba(160,170,200,.15)'],
    rain:     ['#0d1a2d', '#0f2035', 'rgba(40,80,180,.5)', 'rgba(60,120,255,.2)'],
    snow:     ['#1a2030', '#1e2840', 'rgba(160,200,255,.4)', 'rgba(220,230,255,.2)'],
    storm:    ['#0a0d1a', '#0d1525', 'rgba(60,40,180,.5)', 'rgba(120,60,255,.3)'],
  };
  const [bg1, bg2, orb1, orb2] = themes[icon] || themes.clear;
  document.documentElement.style.setProperty('--c-bg1', bg1);
  document.documentElement.style.setProperty('--c-bg2', bg2);
  document.documentElement.style.setProperty('--c-orb1', orb1);
  document.documentElement.style.setProperty('--c-orb2', orb2);
}

// ── Render weather ───────────────────────────────────────
function renderWeather(data, aqiData, cityName) {
  const cur = data.current;
  const unit = state.unit;
  const wmo = getWMO(cur.weather_code);

  // Hero
  dom.heroDate.textContent = new Date().toLocaleDateString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  dom.heroTemp.textContent = fmtTemp(cur.temperature_2m, unit);
  dom.heroUnit.textContent = unit === 'metric' ? '°C' : '°F';
  dom.heroDesc.textContent = wmo.label;
  dom.heroFeels.textContent = fmtTemp(cur.apparent_temperature, unit) + (unit === 'metric' ? '°C' : '°F');

  const todayIdx = 0;
  dom.heroHigh.textContent = fmtTemp(data.daily.temperature_2m_max[todayIdx], unit) + (unit === 'metric' ? '°C' : '°F');
  dom.heroLow.textContent = fmtTemp(data.daily.temperature_2m_min[todayIdx], unit) + (unit === 'metric' ? '°C' : '°F');

  // Weather animation
  if (!weatherAnim) {
    weatherAnim = new WeatherCanvas($('weatherAnimCanvas'));
  }
  weatherAnim.setType(wmo.icon);

  // AQI
  const aqi = aqiData.us_aqi ?? '--';
  dom.aqiVal.textContent = aqi;
  if (aqi !== '--') {
    const { label, color } = aqiInfo(aqi);
    dom.aqiDot.style.background = color;
    dom.aqiLabel.textContent = `· ${label}`;
  }

  // Metrics
  dom.windVal.textContent = fmtWind(cur.wind_speed_10m, unit);
  dom.windDir.textContent = windDirStr(cur.wind_direction_10m) + ' direction';
  setGauge(dom.windGauge, Math.min(cur.wind_speed_10m / 30, 1), 'rgba(91,155,255,.7)');

  dom.humVal.textContent = cur.relative_humidity_2m + '%';
  dom.humDesc.textContent = humDesc(cur.relative_humidity_2m);
  setGauge(dom.humGauge, cur.relative_humidity_2m / 100, 'rgba(96,165,250,.7)');

  dom.visVal.textContent = (cur.visibility / 1000).toFixed(1);
  dom.pressureVal.textContent = Math.round(cur.surface_pressure);
  dom.uvVal.textContent = cur.uv_index?.toFixed(1) ?? '--';
  dom.uvDesc.textContent = uvDesc(cur.uv_index ?? 0);
  dom.uvBar.style.left = `calc(${Math.min(cur.uv_index / 11, 1) * 100}% - 6px)`;

  // Sun arc
  const sunrise = new Date(data.daily.sunrise[0]);
  const sunset = new Date(data.daily.sunset[0]);
  dom.sunriseVal.textContent = fmtTime(sunrise);
  dom.sunsetVal.textContent = fmtTime(sunset);
  const now = new Date();
  const totalMs = sunset - sunrise;
  const elapsed = Math.max(0, Math.min(now - sunrise, totalMs));
  const pct = elapsed / totalMs;
  const angle = Math.PI - pct * Math.PI; // arc from 0→180
  const cx = 50 + Math.cos(angle) * 45;
  const cy = 50 - Math.sin(angle) * 45;
  dom.sunDot.setAttribute('cx', cx.toFixed(1));
  dom.sunDot.setAttribute('cy', cy.toFixed(1));

  // Hourly forecast
  state.hourlyData = data;
  renderHourlyForecast(data);

  // Daily forecast
  renderDailyForecast(data);

  // Environmental data
  renderEnvData(aqiData, data.current);

  // Theme
  setWeatherTheme(cur.weather_code);

  // City labels
  dom.currentCityLabel.textContent = cityName;
  dom.mapCityLabel.textContent = cityName;

  // Last updated
  dom.lastUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function setGauge(el, pct, color) {
  el.innerHTML = '';
  const fill = document.createElement('div');
  fill.className = 'metric-gauge-fill';
  fill.style.width = (pct * 100).toFixed(1) + '%';
  fill.style.background = color;
  el.appendChild(fill);
}

function renderHourlyForecast(data) {
  const list = dom.hourlyList;
  list.innerHTML = '';
  const times = data.hourly.time.slice(0, 24);
  const temps = data.hourly.temperature_2m.slice(0, 24);
  const precip = data.hourly.precipitation_probability.slice(0, 24);
  const codes = data.hourly.weather_code.slice(0, 24);
  const nowH = new Date().getHours();

  times.forEach((t, i) => {
    const d = new Date(t);
    const isNow = d.getHours() === nowH && Math.abs(d - new Date()) < 3600000 * 2;
    const item = document.createElement('div');
    item.className = 'hourly-item' + (isNow ? ' active' : '');
    item.innerHTML = `
      <span class="hourly-time">${isNow ? 'Now' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span class="hourly-icon">${getWMO(codes[i]).emoji}</span>
      <span class="hourly-temp">${fmtTemp(temps[i], state.unit)}°</span>
      ${precip[i] > 0 ? `<span class="hourly-rain"><i class="fa-solid fa-droplet" style="font-size:.6rem"></i>${precip[i]}%</span>` : ''}
    `;
    list.appendChild(item);
  });

  drawHourlyChart(data, state.chartMode);
}

function renderDailyForecast(data) {
  const grid = dom.dailyGrid;
  grid.innerHTML = '';
  const maxTemps = data.daily.temperature_2m_max;
  const minTemps = data.daily.temperature_2m_min;
  const absMax = Math.max(...maxTemps);
  const absMin = Math.min(...minTemps);

  data.daily.time.forEach((date, i) => {
    const d = new Date(date);
    const isToday = i === 0;
    const card = document.createElement('div');
    card.className = 'daily-card' + (isToday ? ' today' : '');
    const barH = ((maxTemps[i] - absMin) / (absMax - absMin + 1)) * 100;

    card.innerHTML = `
      <span class="daily-day">${isToday ? 'Today' : d.toLocaleDateString([], { weekday: 'short' })}</span>
      <span class="daily-icon">${getWMO(data.daily.weather_code[i]).emoji}</span>
      <div class="daily-bar-wrap">
        <div class="daily-bar-fill" style="height:${barH.toFixed(0)}%"></div>
      </div>
      <div class="daily-temps">
        <span class="daily-high">${fmtTemp(maxTemps[i], state.unit)}°</span>
        <span class="daily-low">${fmtTemp(minTemps[i], state.unit)}°</span>
      </div>
      ${data.daily.precipitation_probability_max[i] > 0
        ? `<span class="daily-precip"><i class="fa-solid fa-droplet" style="font-size:.65rem"></i> ${data.daily.precipitation_probability_max[i]}%</span>`
        : ''}
    `;
    grid.appendChild(card);
  });
}

function renderEnvData(aqiData, cur) {
  const list = dom.envList;
  list.innerHTML = '';
  const items = [
    { name: 'PM2.5', val: aqiData.pm2_5?.toFixed(1) ?? '--', unit: 'μg/m³', pct: Math.min((aqiData.pm2_5 || 0) / 75, 1), color: '#f87171' },
    { name: 'PM10', val: aqiData.pm10?.toFixed(1) ?? '--', unit: 'μg/m³', pct: Math.min((aqiData.pm10 || 0) / 150, 1), color: '#fb923c' },
    { name: 'Ozone', val: aqiData.ozone?.toFixed(0) ?? '--', unit: 'μg/m³', pct: Math.min((aqiData.ozone || 0) / 180, 1), color: '#a78bfa' },
    { name: 'NO₂', val: aqiData.nitrogen_dioxide?.toFixed(0) ?? '--', unit: 'μg/m³', pct: Math.min((aqiData.nitrogen_dioxide || 0) / 40, 1), color: '#60a5fa' },
    { name: 'Humidity', val: (cur.relative_humidity_2m ?? '--') + '%', unit: '', pct: (cur.relative_humidity_2m || 0) / 100, color: '#34d399' },
  ];

  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'env-item';
    div.innerHTML = `
      <div class="env-row">
        <span class="env-name">${it.name}</span>
        <span class="env-val">${it.val} <small style="opacity:.6;font-size:.7rem">${it.unit}</small></span>
      </div>
      <div class="env-track">
        <div class="env-fill" style="width:${(it.pct * 100).toFixed(1)}%;background:${it.color}"></div>
      </div>
    `;
    list.appendChild(div);
  });
}

// ── Suggestions ──────────────────────────────────────────
let suggestTimeout = null;
dom.cityInput.addEventListener('input', () => {
  clearTimeout(suggestTimeout);
  const q = dom.cityInput.value.trim();
  if (q.length < 2) { dom.suggestions.innerHTML = ''; return; }
  suggestTimeout = setTimeout(async () => {
    const results = await geocode(q);
    dom.suggestions.innerHTML = '';
    results.slice(0, 5).forEach(r => {
      const el = document.createElement('div');
      el.className = 'suggestion-item';
      el.textContent = `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country}`;
      el.addEventListener('click', () => {
        dom.cityInput.value = '';
        dom.suggestions.innerHTML = '';
        loadCity(r.name + (r.admin1 ? ', ' + r.admin1 : ''), r.latitude, r.longitude);
      });
      dom.suggestions.appendChild(el);
    });
  }, 400);
});

dom.cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') dom.searchBtn.click();
});

dom.searchBtn.addEventListener('click', async () => {
  const q = dom.cityInput.value.trim();
  if (!q) return;
  const results = await geocode(q);
  if (!results.length) { showToast('City not found'); return; }
  const r = results[0];
  dom.cityInput.value = '';
  dom.suggestions.innerHTML = '';
  loadCity(r.name + (r.admin1 ? ', ' + r.admin1 : '') + ', ' + r.country, r.latitude, r.longitude);
});

// ── Load city ────────────────────────────────────────────
async function loadCity(name, lat, lon, silent = false) {
  state.currentCity = name;
  state.currentLat = lat;
  state.currentLon = lon;
  dom.currentCityLabel.textContent = name;

  if (!silent) showToast(`Loading ${name}…`);
  dom.refreshBtn.classList.add('spinning');

  try {
    const [weatherData, aqiData] = await Promise.all([
      fetchWeather(lat, lon),
      fetchAQI(lat, lon),
    ]);
    state.weather = weatherData;
    renderWeather(weatherData, aqiData, name);
    highlightSaved(name);
  } catch (err) {
    showToast('Failed to load weather data');
    console.error(err);
  } finally {
    dom.refreshBtn.classList.remove('spinning');
    if (!silent) hideToastAfter(2000);
  }

  // Schedule refresh in 10 min
  clearTimeout(state.refreshTimer);
  state.refreshTimer = setTimeout(() => loadCity(name, lat, lon, true), 10 * 60 * 1000);
}

// ── Saved locations ──────────────────────────────────────
function saveCurrent() {
  if (!state.currentCity) return;
  const exists = state.savedLocations.find(l => l.name === state.currentCity);
  if (exists) { showToast('Already saved!'); return; }
  state.savedLocations.push({
    name: state.currentCity,
    lat: state.currentLat,
    lon: state.currentLon,
  });
  persistSaved();
  renderSavedList();
  showToast('Location saved!');
  setTimeout(hideToast, 2000);
}

function persistSaved() {
  localStorage.setItem('wg-saved', JSON.stringify(state.savedLocations));
}

function renderSavedList() {
  dom.savedList.innerHTML = '';
  state.savedLocations.forEach(loc => {
    const li = document.createElement('li');
    li.className = 'saved-item' + (loc.name === state.currentCity ? ' active' : '');
    li.innerHTML = `
      <i class="fa-solid fa-map-pin" style="font-size:.75rem;opacity:.6"></i>
      <span>${loc.name.split(',')[0]}</span>
      <button class="del-btn" title="Remove"><i class="fa-solid fa-xmark"></i></button>
    `;
    li.addEventListener('click', e => {
      if (e.target.closest('.del-btn')) {
        state.savedLocations = state.savedLocations.filter(l => l.name !== loc.name);
        persistSaved();
        renderSavedList();
        return;
      }
      loadCity(loc.name, loc.lat, loc.lon);
    });
    dom.savedList.appendChild(li);
  });
}

function highlightSaved(name) {
  dom.savedList.querySelectorAll('.saved-item').forEach(el => {
    el.classList.toggle('active', el.querySelector('span')?.textContent === name.split(',')[0]);
  });
}

dom.addSaveBtn.addEventListener('click', saveCurrent);
dom.refreshBtn.addEventListener('click', () => {
  if (state.currentCity) loadCity(state.currentCity, state.currentLat, state.currentLon);
});

// ── Unit toggle ──────────────────────────────────────────
dom.unitBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    state.unit = btn.dataset.unit;
    dom.unitBtns.forEach(b => b.classList.toggle('active', b === btn));
    if (state.weather) {
      const cur = state.weather.current;
      dom.heroTemp.textContent = fmtTemp(cur.temperature_2m, state.unit);
      dom.heroUnit.textContent = state.unit === 'metric' ? '°C' : '°F';
      dom.heroFeels.textContent = fmtTemp(cur.apparent_temperature, state.unit) + (state.unit === 'metric' ? '°C' : '°F');
      dom.heroHigh.textContent = fmtTemp(state.weather.daily.temperature_2m_max[0], state.unit) + (state.unit === 'metric' ? '°C' : '°F');
      dom.heroLow.textContent = fmtTemp(state.weather.daily.temperature_2m_min[0], state.unit) + (state.unit === 'metric' ? '°C' : '°F');
      dom.windVal.textContent = fmtWind(cur.wind_speed_10m, state.unit);
      renderHourlyForecast(state.weather);
      renderDailyForecast(state.weather);
    }
  });
});

// ── Theme toggle ─────────────────────────────────────────
dom.themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  state.theme = document.body.classList.contains('light') ? 'light' : 'dark';
  localStorage.setItem('wg-theme', state.theme);
});
if (state.theme === 'light') document.body.classList.add('light');

// ── Chart mode toggle ────────────────────────────────────
dom.chartToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    state.chartMode = btn.dataset.chart;
    dom.chartToggleBtns.forEach(b => b.classList.toggle('active', b === btn));
    if (state.weather) drawHourlyChart(state.weather, state.chartMode);
  });
});

// ── Toast ────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
}
function hideToast() { dom.toast.classList.remove('show'); }
function hideToastAfter(ms) { toastTimer = setTimeout(hideToast, ms); }

// ── Boot ─────────────────────────────────────────────────
async function boot() {
  renderSavedList();

  // Default saved cities
  if (!state.savedLocations.length) {
    state.savedLocations = [
      { name: 'New York, New York, US', lat: 40.7128, lon: -74.006 },
      { name: 'London, England, GB', lat: 51.5074, lon: -0.1278 },
      { name: 'Tokyo, Tokyo, JP', lat: 35.6762, lon: 139.6503 },
      { name: 'Mumbai, Maharashtra, IN', lat: 19.076, lon: 72.8777 },
    ];
    persistSaved();
    renderSavedList();
  }

  // Try geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await geocode(`${lat},${lon}`).catch(() => []);
        const name = res[0]
          ? `${res[0].name}, ${res[0].country}`
          : 'Your Location';
        loadCity(name, lat, lon);
      },
      async () => {
        const geo = await ipGeo();
        loadCity(geo.name, geo.lat, geo.lon);
      },
      { timeout: 5000 }
    );
  } else {
    const geo = await ipGeo();
    loadCity(geo.name, geo.lat, geo.lon);
  }
}

boot();
