// js/main.js
window.addEventListener('DOMContentLoaded', () => {
  // 1) 헤더·푸터 인클루드
  fetch('../html/header.html').then(r => r.text())
    .then(html => document.getElementById('header-area').innerHTML = html);
  // footer는 직접 <footer> 태그를 main.html에 넣었으므로 fetch 불필요
  document.getElementById('logo-area').addEventListener('click', () => {
    window.location.href = 'main.html';
});
  // 2) 슬라이더 로직
  let idx = 0;
  const slides = document.getElementById('slides');
  const total  = slides.children.length;
  document.getElementById('prevBtn').addEventListener('click', () => goToSlide(idx - 1));
  document.getElementById('nextBtn').addEventListener('click', () => goToSlide(idx + 1));
  function goToSlide(i) {
    idx = (i + total) % total;
    slides.style.transform = `translateX(${-100 * idx}%)`;
  }
  setInterval(() => goToSlide(idx + 1), 3000); // ★원본처럼 3초 간격★

  // 3) 챗봇 로직
  const chatToggle   = document.getElementById('chatToggle');
  const chatWindow   = document.getElementById('chatWindow');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatBody     = document.getElementById('chatBody');
  const chatInput    = document.getElementById('chatInput');
  const chatSendBtn  = document.getElementById('chatSendBtn');

  chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) chatInput.focus();
  });
  chatCloseBtn.addEventListener('click', () => chatWindow.classList.remove('open'));

  function sendMessage() {
    const txt = chatInput.value.trim();
    if (!txt) return;
    const um = document.createElement('div');
    um.className = 'chat-msg user'; um.textContent = txt;
    chatBody.appendChild(um);
    const bm = document.createElement('div');
    bm.className = 'chat-msg bot'; bm.textContent = '응답 준비중…';
    chatBody.appendChild(bm);
    chatBody.scrollTop = chatBody.scrollHeight;
    chatInput.value = ''; chatInput.focus();
  }
  chatSendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  });
});

// 3-컬럼 클릭 페이지1,2,3으로 이동이벤트
document.querySelectorAll('.sub').forEach(el => {
  el.addEventListener('click', () => {
    const url = el.dataset.link;
    if (url) window.location.href = url;
  });
});
