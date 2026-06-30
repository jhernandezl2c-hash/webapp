// ===================== REPRODUCTOR =====================
function loadPlayer() {
  const frame = document.getElementById('playerFrame');
  const empty = document.getElementById('playerEmpty');
  const title = document.getElementById('playerTitle');
  const pill = document.getElementById('livePill');

  if (EMBED_SRC && EMBED_SRC.trim() !== "") {
    const iframe = document.createElement('iframe');
    iframe.src = EMBED_SRC;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.scrolling = "no";
    frame.innerHTML = "";
    frame.appendChild(iframe);
    empty.style.display = "none";
  }

  title.textContent = EMBED_LABEL || "Sin transmisión activa";
  pill.style.display = IS_LIVE ? "inline-flex" : "none";
}

// ===================== TRANSMITIR A TV =====================
function showToast(msg, ms = 5000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), ms);
}

document.getElementById('castBtn').addEventListener('click', () => {
  // El SDK de Google Cast solo puede transmitir archivos de video directos
  // (mp4/HLS), no un iframe externo. Para iframes, la vía real es el
  // "Cast de pestaña" nativo de Chrome, que el usuario activa desde el
  // navegador (no se puede disparar por código por seguridad).
  showToast(
    "Para transmitir esta pestaña a tu TV/Chromecast: abre el menú ⋮ de Chrome → " +
    "'Transmitir...' → elige tu dispositivo. Eso manda toda la pestaña, video incluido, " +
    "a cualquier pantalla en tu red.",
    7000
  );
});

// ===================== PARTIDOS EN VIVO / CALENDARIO =====================
const DATA_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

function fmtTime(timeStr) {
  // "13:00 UTC-6" -> "1:00 PM (UTC-6)"
  if (!timeStr) return "";
  return timeStr;
}

function matchIsLiveNow(dateStr, timeStr) {
  try {
    const hourMatch = timeStr.match(/(\d{2}):(\d{2})/);
    if (!hourMatch) return false;
    const kickoff = new Date(`${dateStr}T${hourMatch[1]}:${hourMatch[2]}:00`);
    const now = new Date();
    const diffMs = now - kickoff;
    return diffMs >= 0 && diffMs <= 2 * 60 * 60 * 1000; // ventana de 2h
  } catch (e) {
    return false;
  }
}

async function loadMatches() {
  const list = document.getElementById('matchList');
  try {
    const res = await fetch(DATA_URL);
    const data = await res.json();
    const matches = data.matches || [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Partidos de hoy primero, luego los próximos 5
    const todayMatches = matches.filter(m => m.date === todayStr);
    const upcoming = matches
      .filter(m => m.date > todayStr)
      .slice(0, 5);

    const toShow = [...todayMatches, ...upcoming];

    if (toShow.length === 0) {
      list.innerHTML = `<div style="color:var(--muted);font-size:13px;">No hay partidos programados próximamente en los datos disponibles.</div>`;
      return;
    }

    list.innerHTML = toShow.map(m => {
      const live = m.date === todayStr && matchIsLiveNow(m.date, m.time);
      const score = m.score && m.score.ft ? `${m.score.ft[0]} - ${m.score.ft[1]}` : "vs";
      return `
        <div class="match-row">
          <div class="match-teams">
            <strong>${m.team1} ${live ? '' : ''} ${m.team2}</strong>
            <span class="group-tag">${m.group || ''} · ${m.ground || ''}</span>
          </div>
          <div style="text-align:right;">
            <div class="match-score">${score}</div>
            <div class="match-time">${live ? '🔴 EN VIVO' : fmtTime(m.time)}</div>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    list.innerHTML = `<div style="color:var(--muted);font-size:13px;">No se pudieron cargar los partidos (revisa tu conexión).</div>`;
  }
}

// ===================== INIT =====================
loadPlayer();
loadMatches();
setInterval(loadMatches, 60000); // refresca cada minuto
