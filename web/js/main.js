// js/main.js
window.addEventListener('DOMContentLoaded', () => {
  // 1) 헤더·푸터 인클루드
  fetch('../html/header.html')
    .then(r => r.text())
    .then(html => document.getElementById('header-area').innerHTML = html);
  fetch('../html/footer.html')
    .then(r => r.text())
    .then(html => document.getElementById('footer-area').innerHTML = html);

  // 2) 슬라이더 로직
  let idx = 0;
  const slides = document.getElementById('slides');
  const total  = slides.children.length;
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  function goToSlide(i) {
    idx = (i + total) % total;
    slides.style.transform = `translateX(${-100 * idx}%)`;
  }

  // 버튼 클릭 바인딩 (ID 없으면 동작 안 함 → 위에서 추가)
  prevBtn.addEventListener('click', () => goToSlide(idx - 1));
  nextBtn.addEventListener('click', () => goToSlide(idx + 1));

  // ★6초 간격으로 자동 전환★
  setInterval(() => goToSlide(idx + 1), 6000);

  // 3) 챗봇 토글·닫기·전송
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
  chatCloseBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = text;
    chatBody.appendChild(userMsg);

    // TODO: 실제 챗봇 API 호출 로직 삽입
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.textContent = '응답 준비중…';
    chatBody.appendChild(botMsg);

    chatBody.scrollTop = chatBody.scrollHeight;
    chatInput.value = '';
    chatInput.focus();
  }

  chatSendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
});
