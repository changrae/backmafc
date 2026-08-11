// ========================================================================
// DATA STORE (localStorage based)
// ========================================================================
const STORE_KEY = 'fc_manager_data';

let store = {
  players: [],
  matches: [],
  positions: [
    { id: 'gk', label: 'GK', name: '골키퍼', count: 0 },
    { id: 'df', label: 'DF', name: '수비수', count: 0 },
    { id: 'mf', label: 'MF', name: '미드필더', count: 0 },
    { id: 'fw', label: 'FW', name: '공격수', count: 0 }
  ]
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      store = parsed;
    } else {
      seedData();
    }
  } catch(e) { seedData(); }
  updatePositionCounts();
  saveStore();
}

function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch(e) {}
}

function seedData() {
  store.players = [
    { id: 'p1', name: '김민재', number: 4, position: 'DF', age: 28, height: 188, weight: 82, nationality: '대한민국', status: 'active', notes: '백마FC 주력 수비수' },
    { id: 'p2', name: '이강인', number: 10, position: 'MF', age: 22, height: 173, weight: 65, nationality: '대한민국', status: 'active', notes: '공격형 미드필더, 백마FC 에이스' },
    { id: 'p3', name: '손흥민', number: 7, position: 'FW', age: 32, height: 183, weight: 78, nationality: '대한민국', status: 'active', notes: '백마FC 주력 공격수' },
    { id: 'p4', name: '조현우', number: 1, position: 'GK', age: 32, height: 187, weight: 85, nationality: '대한민국', status: 'active', notes: '수석 골키퍼' },
    { id: 'p5', name: '황희찬', number: 22, position: 'FW', age: 27, height: 177, weight: 72, nationality: '대한민국', status: 'injured', notes: '부상 회복 중, 백마FC 영건' },
    { id: 'p6', name: '김지호', number: 2, position: 'DF', age: 24, height: 180, weight: 70, nationality: '대한민국', status: 'active', notes: '센터백' },
    { id: 'p7', name: '박지수', number: 25, position: 'MF', age: 30, height: 176, weight: 70, nationality: '대한민국', status: 'retired', notes: '은퇴, 백마FC 레전드' },
    { id: 'p8', name: '정우영', number: 8, position: 'MF', age: 23, height: 170, weight: 60, nationality: '대한민국', status: 'active', notes: '크리에이티브 미드필더' },
  ];
  store.matches = [
    { id: 'm1', name: '백마FC 홈 경기 vs 수원FC', date: '2026-07-25', location: '홈구장', opponent: '수원FC', home: true, status: 'scheduled', players: ['p3','p2','p1','p6','p8'] },
    { id: 'm2', name: '백마FC 원정 경기 vs 인천UTD', date: '2026-08-01', location: '인천문학경기장', opponent: '인천UTD', home: false, status: 'scheduled', players: ['p4','p1','p6','p8','p3'] },
  ];
  updatePositionCounts();
  saveStore();
}

function updatePositionCounts() {
  const activePlayers = store.players.filter(p => p.status === 'active');
  store.positions.forEach(pos => {
    pos.count = activePlayers.filter(p => p.position.toLowerCase() === pos.id.toLowerCase()).length;
  });
}

// ========================================================================
// STATE
// ========================================================================
let currentView = 'dashboard';
let editingPlayerId = null;
let editingMatchId = null;
let searchQuery = '';

// ========================================================================
// HELPERS
// ========================================================================
function getPlayer(id) { return store.players.find(p => p.id === id); }
function getMatch(id) { return store.matches.find(m => m.id === id); }
function getPosition(id) { return store.positions.find(p => p.id.toLowerCase() === id.toLowerCase()); }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 8); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function statusLabel(status) {
  const map = { active: '활동', injured: '부상', retired: '은퇴', inactive: '비활동', scheduled: '예정', played: '경기완료', home: '홈', away: '원정' };
  return map[status] || status;
}

function getPlayerInitials(name) { return name.charAt(0); }

// ========================================================================
// TOAST
// ========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { 
    el.style.opacity = '0'; 
    el.style.transition = '0.3s'; 
    el.style.transform = 'translateX(20px)'; 
    setTimeout(() => el.remove(), 300); 
  }, 3000);
}

// ========================================================================
// RENDER: DASHBOARD
// ========================================================================
function renderDashboard() {
  currentView = 'dashboard';
  document.getElementById('pageTitle').textContent = '백마FC 대시보드';
  document.getElementById('mainContent').innerHTML = `
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card"><div class="stat-number" id="statPlayers">0</div><div class="stat-label">총 선수</div></div>
      <div class="stat-card"><div class="stat-number" id="statActive">0</div><div class="stat-label">활동 선수</div></div>
      <div class="stat-card"><div class="stat-number" id="statMatches">0</div><div class="stat-label">총 경기</div></div>
      <div class="stat-card"><div class="stat-number" id="statPositions">0</div><div class="stat-label">포지션</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>📅 다가오는 경기</h3><span class="text-muted">총 ${store.matches.length}경기</span></div>
      <div id="upcomingMatches"></div>
    </div>
    <div class="card mt-2">
      <div class="card-header"><h3>👥 활동 선수 목록</h3><span class="text-muted">${store.players.filter(p=>p.status==='active').length}명</span></div>
      <div id="dashboardPlayerList"></div>
    </div>
  `;
  renderStats();
  renderUpcomingMatches();
  renderDashboardPlayers();
  updateNav('dashboard');
}

function renderStats() {
  const players = store.players;
  const active = players.filter(p => p.status === 'active');
  const matches = store.matches;
  document.getElementById('statPlayers').textContent = players.length;
  document.getElementById('statActive').textContent = active.length;
  document.getElementById('statMatches').textContent = matches.length;
  document.getElementById('statPositions').textContent = store.positions.length;
  document.getElementById('playerCountBadge').textContent = `👥 ${players.length}명`;
  document.getElementById('matchCountBadge').textContent = `📅 ${matches.length}경기`;
}

function renderUpcomingMatches() {
  const sorted = [...store.matches].sort((a,b) => a.date.localeCompare(b.date));
  const container = document.getElementById('upcomingMatches');
  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>예정된 경기가 없습니다.</p></div>';
    return;
  }
  container.innerHTML = sorted.map(m => `
    <div class="match-list-item" style="cursor:pointer;" data-match-id="${m.id}" onclick="navigateToMatchDetail('${m.id}')">
      <div class="match-info">
        <div class="date">${formatDate(m.date)}</div>
        <div class="vs">vs ${m.opponent}</div>
        <div style="font-size:0.8rem;color:var(--text-light);">${m.location} · ${m.home ? '홈' : '원정'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;">
        <span class="match-status" style="${m.status==='scheduled'?'background:rgba(0,230,118,0.15);color:var(--accent-light)':''}">${statusLabel(m.status)}</span>
        <span class="text-muted" style="font-size:0.8rem;">⚽ ${(m.players||[]).filter(id=>getPlayer(id)).length}명 배정</span>
      </div>
    </div>
  `).join('');
}

function renderDashboardPlayers() {
  const active = store.players.filter(p => p.status === 'active');
  const container = document.getElementById('dashboardPlayerList');
  if (active.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>활동 선수가 없습니다.</p></div>';
    return;
  }
  container.innerHTML = `
    <div class="player-grid">
      ${active.map(p => `
        <div class="player-card" onclick="navigateToPlayerDetail('${p.id}')" style="cursor:pointer;">
          <div class="player-avatar">
            ${getPlayerInitials(p.name)}
            <span class="position-badge">${p.position.toUpperCase()}</span>
          </div>
          <div class="player-body">
            <h4>${p.name}</h4>
            <div class="player-info">
              <span>👕 #${p.number}</span>
              <span>📏 ${p.height}cm / ${p.weight}kg</span>
              <span>🎂 ${p.age}세</span>
              <span class="position-tag pos-${p.position}">${p.position.toUpperCase()}</span>
            </div>
            <p class="text-muted" style="font-size:0.8rem;margin-top:0.25rem;">${p.nationality}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========================================================================
// RENDER: PLAYERS
// ========================================================================
function renderPlayers() {
  currentView = 'players';
  document.getElementById('pageTitle').textContent = '선수 관리';
  const container = document.getElementById('mainContent');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>👥 선수 목록</h3>
        <div class="actions">
          <input type="text" id="playerSearch" value="${searchQuery}" placeholder="🔍 선수 검색..." style="padding:0.4rem 0.75rem;font-size:0.85rem;">
          <button class="btn btn-accent btn-sm" onclick="addPlayerFromDashboard()">➕ 선수 추가</button>
        </div>
      </div>
      <div id="playerListContainer">
        ${renderPlayerTable()}
      </div>
    </div>
  `;
  document.getElementById('playerSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    document.getElementById('playerListContainer').innerHTML = renderPlayerTable();
  });
  updateNav('players');
}

function renderPlayerTable() {
  let list = [...store.players];
  if (searchQuery) {
    list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (list.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">🏃</div><p>등록된 선수가 없습니다.</p></div>`;
  }
  return `
    <!-- Desktop Table View -->
    <div class="table-wrap desktop-only">
      <table>
        <thead><tr>
          <th>번호</th><th>이름</th><th>포지션</th><th>나이</th><th>신장/체중</th><th>상태</th><th>관리</th>
        </tr></thead>
        <tbody>
          ${list.map(p => `
            <tr>
              <td>#${p.number}</td>
              <td><strong>${p.name}</strong></td>
              <td><span class="position-tag pos-${p.position}">${p.position.toUpperCase()}</span></td>
              <td>${p.age}세</td>
              <td>${p.height}cm / ${p.weight}kg</td>
              <td><span class="status status-${p.status}">${statusLabel(p.status)}</span></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="navigateToPlayerDetail('${p.id}')">상세</button>
                <button class="btn btn-outline btn-sm" onclick="editPlayer('${p.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deletePlayer('${p.id}')">삭제</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Responsive Card View -->
    <div class="mobile-card-list mobile-only">
      ${list.map(p => `
        <div class="mobile-item-card" onclick="navigateToPlayerDetail('${p.id}')">
          <div class="item-header">
            <div class="item-title">
              <span class="item-name">${p.name}</span>
              <span class="item-sub">#${p.number}</span>
            </div>
            <span class="position-tag pos-${p.position}">${p.position.toUpperCase()}</span>
          </div>
          <div class="item-details">
            <div>나이: <strong>${p.age}세</strong></div>
            <div>피지컬: <strong>${p.height}cm / ${p.weight}kg</strong></div>
            <div>국적: <strong>${p.nationality}</strong></div>
          </div>
          <div class="item-footer">
            <span class="status status-${p.status}">${statusLabel(p.status)}</span>
            <div class="item-actions" onclick="event.stopPropagation();">
              <button class="btn btn-outline btn-sm" onclick="editPlayer('${p.id}')">수정</button>
              <button class="btn btn-danger btn-sm" onclick="deletePlayer('${p.id}')">삭제</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========================================================================
// RENDER: MATCHES
// ========================================================================
function renderMatches() {
  currentView = 'matches';
  document.getElementById('pageTitle').textContent = '경기 일정';
  const container = document.getElementById('mainContent');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📅 경기 일정</h3>
        <div class="actions">
          <button class="btn btn-accent btn-sm" onclick="addMatchFromDashboard()">➕ 새 경기</button>
        </div>
      </div>
      <div id="matchListContainer">
        ${renderMatchList()}
      </div>
    </div>
  `;
  updateNav('matches');
}

function renderMatchList() {
  const list = [...store.matches].sort((a,b) => a.date.localeCompare(b.date));
  if (list.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">📅</div><p>등록된 경기가 없습니다.</p></div>`;
  }
  return `
    <!-- Desktop Table View -->
    <div class="table-wrap desktop-only">
      <table>
        <thead><tr><th>날짜</th><th>경기명</th><th>상대</th><th>장소</th><th>상태</th><th>배정 선수</th><th>관리</th></tr></thead>
        <tbody>
          ${list.map(m => `
            <tr onclick="navigateToMatchDetail('${m.id}')" style="cursor:pointer;">
              <td>${formatDate(m.date)}</td>
              <td><strong>${m.name}</strong></td>
              <td>vs ${m.opponent}</td>
              <td>${m.location}</td>
              <td><span class="status status-${m.status}">${statusLabel(m.status)}</span></td>
              <td>${(m.players||[]).filter(id=>getPlayer(id)).length}명</td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); navigateToMatchDetail('${m.id}')">상세</button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); editMatch('${m.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteMatch('${m.id}')">삭제</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Responsive Card View -->
    <div class="mobile-card-list mobile-only">
      ${list.map(m => `
        <div class="mobile-item-card" onclick="navigateToMatchDetail('${m.id}')">
          <div class="item-header">
            <div class="item-title">
              <span class="item-name">${m.name}</span>
              <span class="item-sub">vs ${m.opponent}</span>
            </div>
            <span class="status status-${m.status}">${statusLabel(m.status)}</span>
          </div>
          <div class="item-details">
            <div>📅 날짜: <strong>${formatDate(m.date)}</strong></div>
            <div>📍 장소: <strong>${m.location} (${m.home ? '홈' : '원정'})</strong></div>
            <div>⚽ 배정: <strong>${(m.players||[]).filter(id=>getPlayer(id)).length}명 출전</strong></div>
          </div>
          <div class="item-footer">
            <span class="text-muted" style="font-size:0.75rem;">터치하여 상세 보기 &rarr;</span>
            <div class="item-actions" onclick="event.stopPropagation();">
              <button class="btn btn-outline btn-sm" onclick="editMatch('${m.id}')">수정</button>
              <button class="btn btn-danger btn-sm" onclick="deleteMatch('${m.id}')">삭제</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========================================================================
// RENDER: POSITIONS
// ========================================================================
function renderPositions() {
  currentView = 'positions';
  document.getElementById('pageTitle').textContent = '포지션 관리';
  const container = document.getElementById('mainContent');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📌 포지션 현황</h3>
        <div class="actions">
          <button class="btn btn-accent btn-sm" onclick="addPosition()">➕ 포지션 추가</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
        ${store.positions.map(pos => {
          const players = store.players.filter(p => p.position.toLowerCase() === pos.id.toLowerCase() && p.status === 'active');
          return `
            <div class="card" style="padding:1.25rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <span class="position-tag pos-${pos.label}">${pos.label}</span>
                <span style="font-size:0.9rem;color:var(--accent-light);font-weight:700;">${players.length}명</span>
              </div>
              <p class="text-muted" style="font-size:0.9rem;font-weight:600;">${pos.name}</p>
              <div style="margin-top:1rem;display:flex;gap:0.4rem;">
                <button class="btn btn-outline btn-sm" onclick="editPosition('${pos.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deletePosition('${pos.id}')">삭제</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  updateNav('positions');
}

// ========================================================================
// NAVIGATION
// ========================================================================
function navigateTo(view) {
  currentView = view;
  if (view === 'dashboard') renderDashboard();
  else if (view === 'players') renderPlayers();
  else if (view === 'matches') renderMatches();
  else if (view === 'positions') renderPositions();
  updateNav(view);
  closeMobileMenu();
}

function updateNav(view) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
}

function navigateToPlayers() {
  navigateTo('players');
}

function navigateToPlayerDetail(id) {
  editingPlayerId = id;
  renderPlayerDetail();
}

function navigateToMatchDetail(id) {
  editingMatchId = id;
  renderMatchDetail();
}

function editPlayer(id) {
  editingPlayerId = id;
  showPlayerForm();
}

function editMatch(id) {
  editingMatchId = id;
  showMatchForm();
}

function addPlayerFromDashboard() {
  editingPlayerId = null;
  showPlayerForm();
}

function addMatchFromDashboard() {
  editingMatchId = null;
  showMatchForm();
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    sidebar.classList.add('open');
    backdrop?.classList.add('open');
  }
}

function closeMobileMenu() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('open');
}

// ========================================================================
// MODAL: PLAYER FORM
// ========================================================================
function showPlayerForm() {
  const player = editingPlayerId ? getPlayer(editingPlayerId) : null;
  document.getElementById('modalTitle').textContent = player ? '✏️ 선수 수정' : '➕ 새 선수 등록';
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>이름 *</label>
        <input type="text" id="playerFormName" value="${player ? player.name : ''}" placeholder="선수 이름">
      </div>
      <div class="form-group">
        <label>등번호 *</label>
        <input type="number" id="playerFormNumber" min="1" max="99" value="${player ? player.number : ''}" placeholder="1~99">
      </div>
      <div class="form-group">
        <label>포지션 *</label>
        <select id="playerFormPosition">
          ${store.positions.map(p => `<option value="${p.label}" ${player && player.position.toUpperCase() === p.label ? 'selected' : ''}>${p.label} - ${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>나이 *</label>
        <input type="number" id="playerFormAge" min="15" max="50" value="${player ? player.age : ''}" placeholder="나이">
      </div>
      <div class="form-group">
        <label>신장 (cm) *</label>
        <input type="number" id="playerFormHeight" min="150" max="220" value="${player ? player.height : ''}" placeholder="150~220">
      </div>
      <div class="form-group">
        <label>체중 (kg) *</label>
        <input type="number" id="playerFormWeight" min="45" max="130" value="${player ? player.weight : ''}" placeholder="45~130">
      </div>
      <div class="form-group">
        <label>국적</label>
        <input type="text" id="playerFormNationality" value="${player ? player.nationality : ''}" placeholder="대한민국">
      </div>
      <div class="form-group">
        <label>상태</label>
        <select id="playerFormStatus">
          <option value="active" ${!player || player.status==='active'?'selected':''}>활동</option>
          <option value="injured" ${player && player.status==='injured'?'selected':''}>부상</option>
          <option value="retired" ${player && player.status==='retired'?'selected':''}>은퇴</option>
          <option value="inactive" ${player && player.status==='inactive'?'selected':''}>비활동</option>
        </select>
      </div>
      <div class="form-group full-width">
        <label>메모</label>
        <textarea id="playerFormNotes" placeholder="추가 정보...">${player ? player.notes : ''}</textarea>
      </div>
    </div>
    <input type="hidden" id="playerFormId" value="${player ? player.id : ''}">
  `;
  document.getElementById('modalConfirm').textContent = player ? '✏️ 수정 완료' : '✅ 등록 완료';
  document.getElementById('modalCancel').textContent = '취소';
  openModal('playerForm');
}

function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.add('open');
  overlay.dataset.type = type;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function handleModalConfirm() {
  const type = document.getElementById('modalOverlay').dataset.type;
  if (type === 'playerForm') {
    handlePlayerFormSubmit();
  } else if (type === 'matchForm') {
    handleMatchFormSubmit();
  }
  closeModal();
}

function handlePlayerFormSubmit() {
  const id = document.getElementById('playerFormId').value;
  const name = document.getElementById('playerFormName').value.trim();
  const number = parseInt(document.getElementById('playerFormNumber').value);
  const position = document.getElementById('playerFormPosition').value;
  const age = parseInt(document.getElementById('playerFormAge').value);
  const height = parseInt(document.getElementById('playerFormHeight').value);
  const weight = parseInt(document.getElementById('playerFormWeight').value);
  const nationality = document.getElementById('playerFormNationality').value.trim();
  const status = document.getElementById('playerFormStatus').value;
  const notes = document.getElementById('playerFormNotes').value.trim();

  if (!name || isNaN(number) || !position || isNaN(age) || isNaN(height) || isNaN(weight)) {
    showToast('필수 항목을 올바르게 모두 입력해주세요.', 'error');
    return;
  }

  if (id) {
    const idx = store.players.findIndex(p => p.id === id);
    if (idx !== -1) {
      store.players[idx] = { ...store.players[idx], name, number, position, age, height, weight, nationality, status, notes };
      showToast('선수 정보가 수정되었습니다.', 'success');
    }
  } else {
    const newPlayer = {
      id: generateId(),
      name,
      number,
      position,
      age,
      height,
      weight,
      nationality: nationality || '대한민국',
      status: status || 'active',
      notes
    };
    store.players.push(newPlayer);
    showToast('새 선수가 등록되었습니다.', 'success');
    editingPlayerId = newPlayer.id;
  }
  updatePositionCounts();
  saveStore();
  if (currentView === 'players') {
    renderPlayers();
  } else {
    renderPlayerDetail();
  }
}

// ========================================================================
// MODAL: MATCH FORM
// ========================================================================
function showMatchForm() {
  const match = editingMatchId ? getMatch(editingMatchId) : null;
  const availablePlayers = store.players.filter(p => p.status === 'active');
  document.getElementById('modalTitle').textContent = match ? '✏️ 경기 수정' : '➕ 새 경기 등록';
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>경기명 *</label>
        <input type="text" id="matchFormName" value="${match ? match.name : ''}" placeholder="예: 백마FC 홈 경기 vs 라이벌">
      </div>
      <div class="form-group">
        <label>상대팀 *</label>
        <input type="text" id="matchFormOpponent" value="${match ? match.opponent : ''}" placeholder="상대팀 이름">
      </div>
      <div class="form-group">
        <label>날짜 *</label>
        <input type="date" id="matchFormDate" value="${match ? match.date : formatDate(new Date(Date.now() + 86400000 * 7))}">
      </div>
      <div class="form-group">
        <label>장소 *</label>
        <input type="text" id="matchFormLocation" value="${match ? match.location : ''}" placeholder="경기장 이름">
      </div>
      <div class="form-group">
        <label>홈/원정</label>
        <select id="matchFormHome">
          <option value="true" ${match && match.home===true?'selected':''}>홈 경기</option>
          <option value="false" ${match && match.home===false?'selected':''}>원정 경기</option>
        </select>
      </div>
      <div class="form-group">
        <label>배정 선수</label>
        <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.4rem;" id="matchPlayerList">
          ${availablePlayers.length === 0 ? '<p class="text-muted">배정할 활동 선수가 없습니다.</p>' : availablePlayers.map(p => {
            const assigned = match ? match.players.includes(p.id) : false;
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.2rem 0.4rem;border-radius:4px;margin-bottom:2px;font-size:0.8rem;background:${assigned?'rgba(0,230,118,0.12)':'transparent'};">
              <span>${p.name} (#${p.number})</span>
              <button class="btn ${assigned?'btn-danger btn-sm':'btn-success btn-sm'}" onclick="toggleMatchPlayer('${p.id}','${match ? match.id : 'new'}')">${assigned?'제외':'배정'}</button>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <input type="hidden" id="matchFormId" value="${match ? match.id : ''}">
  `;
  document.getElementById('modalConfirm').textContent = match ? '✏️ 수정 완료' : '✅ 등록 완료';
  document.getElementById('modalCancel').textContent = '취소';
  openModal('matchForm');
}

function toggleMatchPlayer(playerId, matchId) {
  if (matchId === 'new') {
    showToast('경기를 먼저 저장한 후 선수를 배정해주세요.', 'warning');
    return;
  }
  const match = getMatch(matchId);
  if (match) {
    const idx = match.players.indexOf(playerId);
    if (idx !== -1) {
      match.players.splice(idx, 1);
      showToast('선수가 배정에서 제외되었습니다.', 'success');
    } else {
      match.players.push(playerId);
      showToast('선수가 배정되었습니다.', 'success');
    }
    saveStore();
    if (editingMatchId === matchId) renderMatchDetail();
  }
}

function handleMatchFormSubmit() {
  const id = document.getElementById('matchFormId').value;
  const name = document.getElementById('matchFormName').value.trim();
  const opponent = document.getElementById('matchFormOpponent').value.trim();
  const date = document.getElementById('matchFormDate').value;
  const location = document.getElementById('matchFormLocation').value.trim();
  const home = document.getElementById('matchFormHome').value === 'true';

  if (!name || !opponent || !date || !location) {
    showToast('필수 항목을 모두 입력해주세요.', 'error');
    return;
  }

  if (id) {
    const idx = store.matches.findIndex(m => m.id === id);
    if (idx !== -1) {
      store.matches[idx] = { ...store.matches[idx], name, opponent, date, location, home };
      showToast('경기 정보가 수정되었습니다.', 'success');
    }
  } else {
    const newMatch = {
      id: generateId(),
      name,
      opponent,
      date,
      location,
      home,
      status: 'scheduled',
      players: []
    };
    store.matches.push(newMatch);
    showToast('새 경기가 등록되었습니다.', 'success');
    editingMatchId = newMatch.id;
  }
  saveStore();
  if (currentView === 'matches') {
    renderMatches();
  } else {
    renderMatchDetail();
  }
}

// ========================================================================
// PLAYER DETAIL
// ========================================================================
function renderPlayerDetail() {
  const player = editingPlayerId ? getPlayer(editingPlayerId) : null;
  if (!player) {
    renderPlayers();
    return;
  }
  document.getElementById('pageTitle').textContent = `${player.name} - 선수 프로필`;
  document.getElementById('mainContent').innerHTML = `
    <div class="card" style="max-width:700px;">
      <div class="player-card" style="border:none;box-shadow:none;">
        <div class="player-avatar">
          ${getPlayerInitials(player.name)}
          <span class="position-badge">${player.position.toUpperCase()} #${player.number}</span>
        </div>
        <div class="player-body" style="padding:1.25rem;">
          <h4 style="font-size:1.3rem;">${player.name}</h4>
          <div class="position-tags mt-1">
            <span class="position-tag pos-${player.position}">${player.position.toUpperCase()}</span>
            <span style="padding:0.15rem 0.5rem;background:var(--primary-light);border-radius:4px;font-weight:700;">👕 #${player.number}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:1.25rem;margin:1rem 0;padding:1rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);">
            <div><strong>나이</strong><br>${player.age}세</div>
            <div><strong>신장</strong><br>${player.height}cm</div>
            <div><strong>체중</strong><br>${player.weight}kg</div>
            <div><strong>국적</strong><br>${player.nationality}</div>
            <div><strong>상태</strong><br><span class="status status-${player.status}">${statusLabel(player.status)}</span></div>
          </div>
          ${player.notes ? `<p class="text-muted" style="font-style:italic;">📝 ${player.notes}</p>` : ''}
          <div class="player-actions">
            <button class="btn btn-accent" onclick="navigateToPlayers()">← 목록</button>
            <button class="btn btn-outline" onclick="editPlayer('${player.id}')">✏️ 수정</button>
            <button class="btn btn-danger" onclick="deletePlayer('${player.id}')">🗑️ 삭제</button>
          </div>
        </div>
      </div>
    </div>
  `;
  updateNav('players');
  closeMobileMenu();
}

// ========================================================================
// MATCH DETAIL
// ========================================================================
function renderMatchDetail() {
  const match = editingMatchId ? getMatch(editingMatchId) : null;
  if (!match) {
    renderMatches();
    return;
  }
  document.getElementById('pageTitle').textContent = `${match.name} - 경기 상세`;
  const players = [...(match.players || [])].map(id => getPlayer(id)).filter(Boolean);
  const allActive = store.players.filter(p => p.status === 'active');

  const positions = ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'FW'];
  const positionMap = {};
  positions.forEach((pos, idx) => {
    positionMap[`field-${idx}`] = pos;
  });

  const fieldCells = [];
  for (let i = 0; i < 11; i++) {
    const targetPos = positionMap[`field-${i}`];
    const assigned = players.find(p => p.position.toUpperCase() === targetPos.toUpperCase());
    fieldCells.push(assigned ? assigned : null);
  }

  const subs = allActive.filter(p => !players.includes(p));

  document.getElementById('mainContent').innerHTML = `
    <div class="card" style="max-width:800px;">
      <div class="card-header">
        <div><h3 style="font-size:1.1rem;">${match.name}</h3><span class="text-muted" style="font-size:0.85rem;">vs ${match.opponent} · ${match.location}</span></div>
        <div class="actions">
          <button class="btn btn-accent btn-sm" onclick="editMatch('${match.id}')">✏️ 수정</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMatch('${match.id}')">🗑️ 삭제</button>
        </div>
      </div>

      <div style="display:flex;gap:2rem;flex-wrap:wrap;margin-bottom:1rem;padding:0.75rem 0;border-bottom:1px solid var(--border);">
        <div><strong>📅 날짜</strong> ${formatDate(match.date)}</div>
        <div><strong>🏠 홈/원정</strong> ${match.home?'홈':'원정'}</div>
        <div><strong>⚽ 배정 선수</strong> ${players.length}/${positions.length}명</div>
      </div>

      <div style="margin-bottom:1.5rem;">
        <div style="font-size:0.8rem;color:var(--text-light);margin-bottom:0.5rem;text-align:center;font-weight:700;">백마FC 포메이션 (11명)</div>
        <div class="field-grid" id="fieldGrid">
          ${fieldCells.map((cell, idx) => {
            const pos = positionMap[`field-${idx}`];
            if (!cell) {
              return `<div class="empty-cell">${pos}</div>`;
            }
            return `<div class="player-cell">
              <span class="p-name">${cell.name}</span>
              <span class="p-num">#${cell.number}</span>
              <span class="p-pos pos-${cell.position}">${cell.position.toUpperCase()}</span>
              <div class="p-actions">
                <button class="btn btn-danger btn-sm" onclick="removePlayerFromMatch('${match.id}','${cell.id}')">✕</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card-header" style="margin-bottom:1rem;">
        <h3>➕ 선수 추가 배정</h3>
        <span class="text-muted">${subs.length}명 가능</span>
      </div>
      ${subs.length === 0 ? '<p class="text-muted">추가 배정 가능한 활동 선수가 없습니다.</p>' : `
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${subs.map(p => `
            <div style="display:flex;align-items:center;gap:0.4rem;padding:0.3rem 0.7rem;background:var(--primary-dark);border:1px solid var(--border);border-radius:var(--radius-sm);">
              <span>${p.name} (#${p.number}) - ${p.position.toUpperCase()}</span>
              <button class="btn btn-success btn-sm" onclick="addPlayerToMatch('${match.id}','${p.id}')">배정</button>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  updateNav('matches');
  closeMobileMenu();
}

function addPlayerToMatch(matchId, playerId) {
  const match = getMatch(matchId);
  if (match && !match.players.includes(playerId)) {
    match.players.push(playerId);
    saveStore();
    showToast(`${getPlayer(playerId).name} 선수가 배정되었습니다.`, 'success');
    renderMatchDetail();
  }
}

function removePlayerFromMatch(matchId, playerId) {
  const match = getMatch(matchId);
  if (match) {
    const idx = match.players.indexOf(playerId);
    if (idx !== -1) {
      match.players.splice(idx, 1);
      saveStore();
      showToast('선수가 배정에서 제외되었습니다.', 'success');
      renderMatchDetail();
    }
  }
}

// ========================================================================
// CRUD OPERATIONS
// ========================================================================
function deletePlayer(id) {
  if (!confirm('정말 이 선수를 삭제하시겠습니까?')) return;
  store.players = store.players.filter(p => p.id !== id);
  store.matches.forEach(m => { m.players = m.players.filter(pid => pid !== id); });
  updatePositionCounts();
  saveStore();
  showToast('선수가 삭제되었습니다.', 'success');
  renderPlayers();
}

function deleteMatch(id) {
  if (!confirm('정말 이 경기를 삭제하시겠습니까?')) return;
  store.matches = store.matches.filter(m => m.id !== id);
  saveStore();
  showToast('경기가 삭제되었습니다.', 'success');
  renderMatches();
}

function addPosition() {
  showToast('포지션 기본 설정 기능입니다.', 'warning');
}

function editPosition(id) {
  showToast('포지션 정보 수정 기능 준비 중입니다.', 'warning');
}

function deletePosition(id) {
  showToast('기본 포지션은 삭제할 수 없습니다.', 'error');
}

// ========================================================================
// EVENT LISTENERS & INITIALIZATION
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadStore();
  renderDashboard();

  // Navigation click handlers
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.dataset.view);
    });
  });

  // Mobile bottom navigation handlers
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.dataset.view);
    });
  });

  // Mobile drawer toggle & backdrop click
  document.getElementById('mobileToggle')?.addEventListener('click', toggleMobileMenu);
  document.getElementById('sidebarBackdrop')?.addEventListener('click', closeMobileMenu);

  // Modal actions
  document.getElementById('modalCancel')?.addEventListener('click', closeModal);
  document.getElementById('modalConfirm')?.addEventListener('click', handleModalConfirm);
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
});

// Expose functions to global scope for HTML event handlers
window.navigateTo = navigateTo;
window.navigateToPlayers = navigateToPlayers;
window.navigateToPlayerDetail = navigateToPlayerDetail;
window.navigateToMatchDetail = navigateToMatchDetail;
window.addPlayerFromDashboard = addPlayerFromDashboard;
window.addMatchFromDashboard = addMatchFromDashboard;
window.editPlayer = editPlayer;
window.editMatch = editMatch;
window.deletePlayer = deletePlayer;
window.deleteMatch = deleteMatch;
window.addPlayerToMatch = addPlayerToMatch;
window.removePlayerFromMatch = removePlayerFromMatch;
window.toggleMatchPlayer = toggleMatchPlayer;
window.showPlayerForm = showPlayerForm;
window.showMatchForm = showMatchForm;
window.renderPlayerDetail = renderPlayerDetail;
window.renderMatchDetail = renderMatchDetail;
window.handlePlayerFormSubmit = handlePlayerFormSubmit;
window.handleMatchFormSubmit = handleMatchFormSubmit;
window.addPosition = addPosition;
window.editPosition = editPosition;
window.deletePosition = deletePosition;
