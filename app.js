let data;
let faction = 'alliance';
let activeClass = null;
let currentView = 'cards';
let selected = null;

const els = {
  classFilters: document.querySelector('#classFilters'),
  cardsView: document.querySelector('#cardsView'),
  matrixView: document.querySelector('#matrixView'),
  activeHint: document.querySelector('#activeHint'),
  dialog: document.querySelector('#raceDialog'),
  dialogContent: document.querySelector('#dialogContent'),
  sourceLink: document.querySelector('#sourceLink'),
  raceCount: document.querySelector('#raceCount'),
  comboCount: document.querySelector('#comboCount'),
  updatedText: document.querySelector('#updatedText'),
  selectionPanel: document.querySelector('#selectionPanel'),
  selectionTitle: document.querySelector('#selectionTitle'),
  selectionText: document.querySelector('#selectionText'),
  crest: document.querySelector('#crest'),
  brandFaction: document.querySelector('#brandFaction'),
  eyebrow: document.querySelector('#eyebrow'),
  raceLabel: document.querySelector('#raceLabel'),
  factionButtons: [...document.querySelectorAll('.faction-button')]
};

const classMeta = (name) => data.classes.find(c => c.name === name);
const comboCount = () => data.races.reduce((n, r) => n + r.classes.length, 0);
const factionName = () => faction === 'alliance' ? 'Alliance' : 'Horde';

function renderClassFilters() {
  els.classFilters.innerHTML = data.classes.map(c => `
    <button class="class-filter ${activeClass === c.name ? 'active' : ''}" data-class="${c.name}">
      <span class="class-icon">${c.icon}</span>
      <span>${c.name}</span>
    </button>
  `).join('');

  els.classFilters.querySelectorAll('.class-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.class;
      activeClass = activeClass === next ? null : next;
      renderAll();
    });
  });
}

function renderCards() {
  const races = activeClass ? data.races.filter(r => r.classes.includes(activeClass)) : data.races;

  els.cardsView.innerHTML = races.map((race) => `
    <article class="race-card" style="--accent:${race.accent}">
      <div class="portrait-wrap">
        <span class="race-index">${String(data.races.indexOf(race) + 1).padStart(2, '0')}</span>
        <img class="race-portrait" src="${race.image}" alt="Portrét rasy ${race.name}">
      </div>
      <div class="card-content">
        <span class="race-kicker">${race.subtitle}</span>
        <div class="title-row">
          <h2>${race.shortName || race.name}</h2>
          <button class="open-race" data-open="${race.slug}">Detail</button>
        </div>
        <p>${race.description}</p>

        <section class="card-section">
          <h3>Racials</h3>
          <div class="racial-list-compact">
            ${race.racials.map(x => `
              <div class="racial-compact">
                <span class="racial-badge">${x.type}</span>
                <strong>${x.name}</strong>
                <small>${x.text}</small>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="card-section">
          <h3>Dostupné classy</h3>
          <div class="class-stack">
            ${race.classes.map(name => {
              const c = classMeta(name);
              const isSelected = selected?.race === race.slug && selected?.className === name;
              return `
                <button class="class-card ${isSelected ? 'selected' : ''}" data-race="${race.slug}" data-pick="${name}">
                  <span class="class-icon large">${c.icon}</span>
                  <span>
                    <b>${name}</b>
                    <small>${c.role}</small>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </section>
      </div>
    </article>
  `).join('');

  els.cardsView.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openRace(btn.dataset.open)));
  els.cardsView.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.race, btn.dataset.pick)));
}

function renderMatrix() {
  const classes = data.classes;
  els.matrixView.innerHTML = `
    <table class="matrix">
      <thead>
        <tr>
          <th>Race</th>
          ${classes.map(c => `<th title="${c.role}"><span class="matrix-icon">${c.icon}</span><br>${c.name}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.races.map(race => `
          <tr>
            <td>
              <div class="matrix-race-cell">
                <img src="${race.image}" alt="${race.name}">
                <div>
                  <strong>${race.shortName || race.name}</strong><br>
                  <small>${race.subtitle}</small>
                </div>
              </div>
            </td>
            ${classes.map(c => race.classes.includes(c.name)
              ? `<td><button class="matrix-yes" title="Vybrat ${race.shortName || race.name} ${c.name}" data-matrix-race="${race.slug}" data-matrix-class="${c.name}">✓</button></td>`
              : `<td class="matrix-no">—</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  els.matrixView.querySelectorAll('[data-matrix-race]').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.matrixRace, btn.dataset.matrixClass)));
}

function renderHint() {
  if (!activeClass) {
    els.activeHint.textContent = `Zobrazuji všech ${data.races.length} ${factionName()} ras a ${comboCount()} race/class kombinací.`;
  } else {
    const matches = data.races.filter(r => r.classes.includes(activeClass));
    els.activeHint.textContent = `${activeClass}: ${matches.map(r => r.shortName || r.name).join(' • ')}`;
  }
}

function openRace(slug) {
  const race = data.races.find(r => r.slug === slug);
  els.dialogContent.innerHTML = `
    <div class="dialog-layout" style="--accent:${race.accent}">
      <div class="dialog-art">
        <img src="${race.image}" alt="${race.name}">
      </div>
      <div class="dialog-body">
        <span class="race-kicker">${race.subtitle}</span>
        <h2>${race.name}</h2>
        <p>${race.description}</p>

        <div class="detail-section">
          <h3>Racials</h3>
          <div class="racial-list big">
            ${race.racials.map(x => `
              <div class="racial-item">
                <span class="racial-type">${x.type}</span>
                <strong>${x.name}</strong>
                <span>${x.text}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="detail-section">
          <h3>Dostupné classy</h3>
          <div class="class-choice-grid vertical">
            ${race.classes.map(name => {
              const c = classMeta(name);
              return `
                <button class="class-choice" data-dialog-pick="${name}">
                  <span class="class-icon xl">${c.icon}</span>
                  <span>
                    <b>${name}</b>
                    <small>${c.role} • ${c.fantasy}</small>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;

  els.dialogContent.querySelectorAll('[data-dialog-pick]').forEach(btn => btn.addEventListener('click', () => {
    choose(race.slug, btn.dataset.dialogPick);
    els.dialog.close();
  }));
  els.dialog.showModal();
}

function choose(raceSlug, className) {
  const race = data.races.find(r => r.slug === raceSlug);
  const c = classMeta(className);
  selected = { race: raceSlug, className };
  els.selectionPanel.classList.remove('hidden');
  els.selectionTitle.textContent = `${race.shortName || race.name} ${className}`;
  els.selectionText.textContent = `${c.role} • ${c.fantasy}. Racials: ${race.racials.map(r => r.name).join(', ')}.`;
  renderCards();
  els.selectionPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function reset() {
  activeClass = null;
  selected = null;
  els.selectionPanel.classList.add('hidden');
  renderAll();
}

function renderFactionChrome() {
  document.body.dataset.faction = faction;
  const name = factionName();
  els.crest.textContent = faction === 'alliance' ? 'A' : 'H';
  els.brandFaction.textContent = name;
  els.eyebrow.textContent = `WORLD OF WARCRAFT: FOREVER • ${name.toUpperCase()}`;
  els.raceLabel.textContent = `${name} ras`;
  els.factionButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.faction === faction));
  document.title = `${name} Character Forge — WoW Forever`;
}

function renderAll() {
  renderFactionChrome();
  renderClassFilters();
  renderCards();
  renderMatrix();
  renderHint();
}

async function loadFaction(nextFaction, updateHash = true) {
  faction = nextFaction === 'horde' ? 'horde' : 'alliance';
  activeClass = null;
  selected = null;
  els.selectionPanel.classList.add('hidden');

  const response = await fetch(`./data/${faction}.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${faction} data`);
  data = await response.json();

  els.sourceLink.href = data.source.url;
  els.raceCount.textContent = data.races.length;
  els.comboCount.textContent = comboCount();
  els.updatedText.textContent = `Aktualizováno ${data.updated}`;

  if (updateHash) history.replaceState(null, '', `#${faction}`);
  renderAll();
}

async function init() {
  const initial = location.hash.toLowerCase() === '#horde' ? 'horde' : 'alliance';
  await loadFaction(initial, false);
}

els.factionButtons.forEach(btn => btn.addEventListener('click', () => loadFaction(btn.dataset.faction)));
document.querySelector('#resetBtn').addEventListener('click', reset);
document.querySelector('#clearSelection').addEventListener('click', reset);
document.querySelector('#closeDialog').addEventListener('click', () => els.dialog.close());
els.dialog.addEventListener('click', (e) => { if (e.target === els.dialog) els.dialog.close(); });

document.querySelectorAll('.view-button').forEach(btn => btn.addEventListener('click', () => {
  currentView = btn.dataset.view;
  document.querySelectorAll('.view-button').forEach(b => b.classList.toggle('active', b === btn));
  els.cardsView.classList.toggle('hidden', currentView !== 'cards');
  els.matrixView.classList.toggle('hidden', currentView !== 'matrix');
}));

init().catch(err => {
  console.error(err);
  document.body.innerHTML = '<main style="padding:40px;color:#1f2937"><h1>Nepodařilo se načíst data.</h1><p>Zkontroluj GitHub Pages deployment.</p></main>';
});