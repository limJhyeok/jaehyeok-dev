// 글 데이터 저장소
let posts = [];
let currentFilter = 'all';
const API_BASE = '/api';

// 마크다운 설정
marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();
marked.use({ renderer });

// API 함수들
async function recordView(postId, postTitle) {
  try {
    await fetch(`${API_BASE}/analytics/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, post_title: postTitle })
    });
  } catch (error) {
    console.error('Failed to record view:', error);
  }
}

async function fetchAnalytics(postId) {
  try {
    const response = await fetch(`${API_BASE}/analytics/${postId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return { today: 0, yesterday: 0, total: 0 };
  }
}

const POSTS_CACHE_KEY = 'posts_cache';

function getCachedPosts() {
  try {
    const raw = localStorage.getItem(POSTS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch {
    return null;
  }
}

function setCachedPosts(data) {
  try {
    localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage unavailable (e.g. private browsing) — silently skip caching
  }
}

function showSkeleton() {
  const card = `
    <div class="skeleton-card">
      <div class="skeleton-line" style="width:60%;height:1.25rem;margin-bottom:0.5rem;"></div>
      <div class="skeleton-line" style="width:25%;height:0.875rem;margin-bottom:1rem;"></div>
      <div class="skeleton-line" style="width:100%;height:0.9rem;margin-bottom:0.5rem;"></div>
      <div class="skeleton-line" style="width:80%;height:0.9rem;"></div>
    </div>`;
  document.getElementById('posts-list').innerHTML =
    '<div class="loading-spinner"></div>' + card.repeat(3);
}

async function loadPosts() {
  const cached = getCachedPosts();
  if (cached) {
    posts = cached;
    renderPosts();
  } else {
    showSkeleton();
  }

  try {
    const response = await fetch(`${API_BASE}/posts`);
    const data = await response.json();
    posts = data.map(post => ({
      id: post.id,
      title: post.title,
      date: post.date,
      category: post.category,
      tags: post.tags || [],
      excerpt: post.excerpt || '',
    }));
    setCachedPosts(posts);
    renderPosts();
  } catch (err) {
    console.error('Failed to load posts:', err);
    if (!cached) {
      document.getElementById('posts-list').innerHTML =
        '<div class="empty-state"><p>글을 불러오지 못했습니다. 잠시 후 새로고침 해주세요.</p></div>';
    }
  }
}



// 글 렌더링
function renderPosts() {
  const postsList = document.getElementById('posts-list');
  
  let filtered = posts;
  if (currentFilter !== 'all') {
    filtered = posts.filter(post => post.category === currentFilter);
  }
  
  if (filtered.length === 0) {
    postsList.innerHTML = '<div class="empty-state"><p>글이 없습니다.</p></div>';
    return;
  }
  
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  postsList.innerHTML = filtered.map(post => `
    <div class="post-item" data-post-id="${post.id}">
      <div class="post-item-header">
        <div>
          <h2 class="post-item-title">${post.title}</h2>
          <p class="post-item-date">${new Date(post.date).toLocaleDateString('ko-KR')}</p>
        </div>
        <span class="post-item-category">${post.category}</span>
      </div>
      <p class="post-item-excerpt">${post.excerpt}</p>
      ${post.tags.length > 0 ? `
        <div class="post-item-tags">
          ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
        </div>
      ` : ''}
      <div class="post-item-stats" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0; font-size: 0.85rem; color: #999;">
        조회수: <span class="view-count">-</span>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.post-item').forEach(item => {
    const postId = item.dataset.postId;
    item.addEventListener('click', () => showPostDetail(postId));

    fetchAnalytics(postId).then(analytics => {
      item.querySelector('.view-count').textContent = analytics.total;
    });
  });

  document.querySelectorAll('.post-item-excerpt').forEach(el => {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ]
    });
  });
}

async function showPostDetail(postId, refresh = false) {
  try {
    // Markdown 원문 가져오기
    const res = await fetch(`${API_BASE}/posts/${postId}`);
    const { meta, content } = await res.json();
    

    if (!refresh) recordView(postId, meta.title);

    const modal = document.getElementById('post-detail');
    const contentEl = document.getElementById('post-content');

    const analytics = await fetchAnalytics(postId);

    const html = marked.parse(content);

    contentEl.innerHTML = `
      <h1>${meta.title}</h1>
      <div style="display:flex;justify-content:space-between;margin-bottom:2rem;color:#666;font-size:0.9rem;">
        <span>${new Date(meta.date).toLocaleDateString('ko-KR')} · ${meta.category}</span>
        <span>조회: 오늘 ${analytics.today} | 어제 ${analytics.yesterday} | 총 ${analytics.total}</span>
      </div>

      <div>
        ${html}
      </div>
    `;
    contentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    renderMathInElement(contentEl, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });

    document.querySelector('.posts-section').classList.add('hidden');
    modal.classList.add('active');
    window.scrollTo(0, 0);

  } catch (err) {
    console.error('Failed to load post detail:', err);
  }
}

function showListView() {
  document.getElementById('post-detail').classList.remove('active');
  document.querySelector('.posts-section').classList.remove('hidden');
  window.scrollTo(0, 0);
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const { github, linkedin } = await res.json();
    setupSocialIcon('github-icon', github);
    setupSocialIcon('linkedin-icon', linkedin);
  } catch {
    setupSocialIcon('github-icon', null);
    setupSocialIcon('linkedin-icon', null);
  }
}

function setupSocialIcon(id, url) {
  const btn = document.getElementById(id);
  if (url) {
    btn.addEventListener('click', () => window.open(url, '_blank', 'noopener,noreferrer'));
  } else {
    btn.classList.add('social-icon--unset');
    btn.addEventListener('click', () => showSocialTooltip(btn, '링크 미설정'));
  }
}

function showSocialTooltip(anchor, message) {
  const tooltip = document.getElementById('social-tooltip');
  const rect = anchor.getBoundingClientRect();
  tooltip.textContent = message;
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top  = `${rect.bottom + 6}px`;
  tooltip.classList.add('visible');
  clearTimeout(tooltip._timer);
  tooltip._timer = setTimeout(() => tooltip.classList.remove('visible'), 2000);
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.back-btn').addEventListener('click', showListView);
  loadProfile();

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderPosts();
    });
  });
  
  loadPosts();
});
