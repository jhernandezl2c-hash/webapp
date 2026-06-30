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
    // Bloquea pop-ups/redirecciones que algunos embeds inyectan al hacer click.
    // No incluye allow-popups ni allow-top-navigation a propósito.
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-presentation allow-forms'
    );
    frame.innerHTML = "";
    frame.appendChild(iframe);
    empty.style.display = "none";
  }

  title.textContent = EMBED_LABEL || "Sin transmisión activa";
  pill.style.display = IS_LIVE ? "inline-flex" : "none";
}

// ===================== TRANSMITIR A TV =====================
function showToast(msg, ms = 6000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), ms);
}

document.getElementById('castBtn').addEventListener('click', () => {
  showToast(
    "Menú ⋮ de Chrome → 'Transmitir...' (o desliza el panel de ajustes rápidos de Android → 'Smart View / Screen Cast') → elige tu TV.",
    7000
  );
});

// ===================== PARTIDOS · ESPN (datos reales) =====================
const ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200";

function teamLine(competitor) {
  const team = competitor.team || {};
  return team.shortDisplayName || team.displayName || team.abbreviation || "?";
}

async function loadMatches() {
  const list = document.getElementById('matchList');
  try {
    const res = await fetch(ESPN_URL);
    const data = await res.json();
    const events = data.events || [];

    if (events.length === 0) {
      list.innerHTML = `<div style="padding:16px;color:var(--muted);font-size:13px;">No hay partidos disponibles en este momento.</div>`;
      return;
    }

    // Ordena: en vivo primero, luego por fecha
    const sorted = [...events].sort((a, b) => {
      const aLive = a.status?.type?.state === 'in' ? 0 : 1;
      const bLive = b.status?.type?.state === 'in' ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.date) - new Date(b.date);
    });

    list.innerHTML = sorted.slice(0, 20).map(ev => {
      const comp = (ev.competitions && ev.competitions[0]) || {};
      const competitors = comp.competitors || [];
      const home = competitors.find(c => c.homeAway === 'home') || competitors[0] || {};
      const away = competitors.find(c => c.homeAway === 'away') || competitors[1] || {};

      const state = ev.status?.type?.state; // 'pre' | 'in' | 'post'
      const isLive = state === 'in';
      const isFinal = state === 'post';

      const venue = comp.venue?.address?.city || comp.venue?.fullName || "";

      let rightLabel;
      if (isLive) {
        rightLabel = ev.status?.type?.shortDetail || "EN VIVO";
      } else if (isFinal) {
        rightLabel = "Finalizado";
      } else {
        const d = new Date(ev.date);
        rightLabel = d.toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      }

      const score = (isLive || isFinal)
        ? `${home.score ?? '-'} - ${away.score ?? '-'}`
        : "vs";

      return `
        <div class="match-row ${isLive ? 'is-live' : ''}">
          <div class="match-teams">
            <strong>${teamLine(home)} · ${teamLine(away)}</strong>
            <span class="group-tag">${venue}</span>
          </div>
          <div style="text-align:right;">
            <div class="match-score">${score}</div>
            <div class="match-time ${isLive ? 'is-live' : ''}">${rightLabel}</div>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    list.innerHTML = `<div style="padding:16px;color:var(--muted);font-size:13px;">No se pudieron cargar los partidos (revisa tu conexión).</div>`;
  }
}

// ===================== INIT =====================
loadPlayer();
loadMatches();
setInterval(loadMatches, 30000); // refresca cada 30s
