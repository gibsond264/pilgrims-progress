/* ===================================================
   A Pilgrim's Progress — App Logic
   =================================================== */

const STORAGE_KEY = 'pilgrims_progress';
const TOTAL = 17;

// ─── Persistence ────────────────────────────────────────────

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { chaptersRead: [], reflections: {}, lastChapter: 1 };
  } catch { return { chaptersRead: [], reflections: {}, lastChapter: 1 }; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function markChapterRead(num) {
  const d = loadData();
  if (!d.chaptersRead.includes(num)) d.chaptersRead.push(num);
  if (d.lastChapter < num) d.lastChapter = num;
  saveData(d);
}

function isRead(num) { return loadData().chaptersRead.includes(num); }

function saveReflection(chapterNum, idx, value) {
  const d = loadData();
  if (!d.reflections[chapterNum]) d.reflections[chapterNum] = ['', '', '', ''];
  d.reflections[chapterNum][idx] = value;
  saveData(d);
}

function getReflections(chapterNum) {
  return loadData().reflections[chapterNum] || ['', '', '', ''];
}

function resetProgress() {
  if (confirm('Reset all reading progress and reflections? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    navigate('home');
  }
}

// ─── Routing ────────────────────────────────────────────────

function navigate(target, pushState = true) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const hash = target.startsWith('chapter') ? `#${target}` : '#home';
  if (pushState) history.pushState(null, '', hash);

  if (target === 'home') {
    renderHome();
    document.getElementById('view-home').classList.add('active');
  } else if (target.startsWith('chapter-')) {
    const num = parseInt(target.split('-')[1], 10);
    if (num >= 1 && num <= TOTAL) {
      renderChapter(num);
      document.getElementById('view-reader').classList.add('active');
      window.scrollTo(0, 0);
    }
  }
}

window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '') || 'home';
  navigate(hash, false);
});

// ─── Home View ──────────────────────────────────────────────

function renderHome() {
  const d = loadData();
  const readCount = d.chaptersRead.length;

  // Progress ring
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (readCount / TOTAL) * circumference;
  document.getElementById('ring-fill').style.strokeDasharray = circumference;
  document.getElementById('ring-fill').style.strokeDashoffset = offset;
  document.getElementById('ring-fraction').textContent = `${readCount}/${TOTAL}`;
  document.getElementById('progress-label-text').textContent =
    readCount === TOTAL ? 'Journey complete!' :
    `${readCount} of ${TOTAL} chapters read`;

  // Continue button
  const nextUnread = CHAPTERS.find(c => !d.chaptersRead.includes(c.number));
  const continueBtn = document.getElementById('btn-continue');
  if (nextUnread) {
    continueBtn.style.display = '';
    continueBtn.textContent = readCount === 0 ? 'Begin Reading' : `Continue — Chapter ${nextUnread.number}`;
    continueBtn.onclick = () => navigate(`chapter-${nextUnread.number}`);
  } else {
    continueBtn.textContent = 'Read Again from the Start';
    continueBtn.onclick = () => navigate('chapter-1');
  }

  // Chapter list
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';
  CHAPTERS.forEach(ch => {
    const read = d.chaptersRead.includes(ch.number);
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="chapter-item${read ? ' read' : ''}" href="#chapter-${ch.number}" data-ch="${ch.number}">
        <span class="chapter-number ui-text">Ch. ${String(ch.number).padStart(2, '0')}</span>
        <span class="chapter-info">
          <span class="chapter-title-text">${ch.title}</span>
          <span class="chapter-subtitle-text">${ch.subtitle}</span>
        </span>
        <span class="chapter-status">${read ? '✦' : ''}</span>
      </a>`;
    list.appendChild(li);
  });

  // Attach click handlers (intercept hash links for SPA navigation)
  list.querySelectorAll('.chapter-item').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(`chapter-${a.dataset.ch}`);
    });
  });
}

// ─── Chapter View ────────────────────────────────────────────

function renderChapter(num) {
  const ch = CHAPTERS[num - 1];
  const d = loadData();
  const read = d.chaptersRead.includes(num);

  // Update last visited
  d.lastChapter = num;
  saveData(d);

  // Progress bar & eyebrow
  const pct = ((num - 1) / (TOTAL - 1)) * 100;
  document.getElementById('reader-progress-fill').style.width = `${pct}%`;
  document.getElementById('reader-chapter-label').textContent = `Chapter ${num} of ${TOTAL}`;

  // Banner
  document.getElementById('chapter-eyebrow').textContent = `Chapter ${num}`;
  document.getElementById('chapter-title').textContent = ch.title;
  document.getElementById('chapter-subtitle').textContent = ch.subtitle;

  // Chapter illustration
  const img = document.getElementById('chapter-image');
  img.src = `images/Chapter${num}.png`;
  img.alt = `Illustration for Chapter ${num}: ${ch.title}`;

  // Body text
  document.getElementById('chapter-body').innerHTML = ch.content;

  // Mark as read button
  const markBtn = document.getElementById('btn-mark-read');
  if (read) {
    markBtn.textContent = '✦ Chapter Read';
    markBtn.classList.add('done');
    markBtn.disabled = true;
  } else {
    markBtn.innerHTML = 'Mark Chapter as Read';
    markBtn.classList.remove('done');
    markBtn.disabled = false;
    markBtn.onclick = () => {
      markChapterRead(num);
      markBtn.textContent = '✦ Chapter Read';
      markBtn.classList.add('done');
      markBtn.disabled = true;
      updateChapterNavReadState(num);
    };
  }

  // Reflections
  renderReflections(ch, num);

  // Navigation — rebuild HTML each render to avoid stale structure
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');

  if (num > 1) {
    prevBtn.innerHTML = `<span>&#8592;</span><span><span class="nav-label ui-text">Previous</span><br><span>${CHAPTERS[num - 2].title}</span></span>`;
    prevBtn.classList.remove('hidden');
    prevBtn.onclick = () => navigate(`chapter-${num - 1}`);
  } else {
    prevBtn.classList.add('hidden');
  }

  if (num < TOTAL) {
    nextBtn.innerHTML = `<span><span class="nav-label ui-text">Next</span><br><span>${CHAPTERS[num].title}</span></span><span>&#8594;</span>`;
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = () => navigate(`chapter-${num + 1}`);
  } else {
    nextBtn.innerHTML = `<span><span class="nav-label ui-text">Journey&#39;s End</span><br><span>Return to Contents</span></span><span>&#8594;</span>`;
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = () => navigate('home');
  }
}

function updateChapterNavReadState(num) {
  // Called after marking read to keep UI consistent without full re-render
}

function renderReflections(ch, num) {
  const saved = getReflections(num);
  const body = document.getElementById('reflections-body');
  body.innerHTML = ch.reflections.map((q, i) => `
    <div class="reflection-item">
      <p class="reflection-question" data-num="${i + 1}">${q}</p>
      <textarea
        class="reflection-textarea"
        data-chapter="${num}"
        data-idx="${i}"
        placeholder="Write your reflection here…"
      >${escapeHtml(saved[i] || '')}</textarea>
    </div>`).join('');

  body.innerHTML += `<p class="autosave-note ui-text">Reflections are saved automatically as you type.</p>`;

  body.querySelectorAll('.reflection-textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      saveReflection(parseInt(ta.dataset.chapter), parseInt(ta.dataset.idx), ta.value);
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Reflections Toggle ──────────────────────────────────────

function initReflectionsToggle() {
  const toggle = document.getElementById('reflections-toggle');
  const body = document.getElementById('reflections-body');
  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('open');
    toggle.classList.toggle('open', open);
  });
}

// ─── Init ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initReflectionsToggle();

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => navigate('home'));

  // Reset progress
  document.getElementById('btn-reset').addEventListener('click', resetProgress);

  // Route on load
  const hash = location.hash.replace('#', '') || 'home';
  navigate(hash, false);
});
