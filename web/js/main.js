// js/main.js
window.addEventListener('DOMContentLoaded', () => {
  // 1) 헤더·푸터 인클루드
    fetch('./header.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('header-area').innerHTML = html;
  //어디서든지 로고누르면 index인 첫페이지로 이동
      document.getElementById('logo-area')
        .addEventListener('click', () => {location.href = '../html/index.html';
   });
   // delay scroll logic until after header is injected
      const header = document.getElementById('site-header');
      const hero   = document.getElementById('hero-slider');
      window.addEventListener('scroll', () => {
        if (window.scrollY > hero.offsetHeight) header.classList.add('hidden');
        else header.classList.remove('hidden');
      });
    })
    .catch(console.error);

  fetch('./footer.html')
  .then(r => r.text())
    .then(html => {
      document.getElementById('footer-area').innerHTML = html;
    })
    .catch(console.error);


  // 2) Overlap Fade Slider (9s)
  const slides = Array.from(document.querySelectorAll('#hero-slider .slide'));
  let idx = 0, total = slides.length;

  function showSlide(i) {
    slides.forEach(s=>s.classList.remove('active'));
    slides[i].classList.add('active');
  }
  document.getElementById('prevBtn')?.addEventListener('click', () => {
    idx = (idx -1 + total)%total; showSlide(idx);
  });
  document.getElementById('nextBtn')?.addEventListener('click', () => {
    idx = (idx +1)%total; showSlide(idx);
  });
   // 10초(10000ms)마다 자동 전환
  setInterval(() => {
    idx = (idx + 1) % total;
    showSlide(idx);
  }, 10000);
});

  // 3컬럼 클릭 페이지1,2,3으로 이동이벤트
  document.querySelectorAll('.sub').forEach(el => {
    el.addEventListener('click', () => {
      const url = el.dataset.link;
      if (url) window.location.href = url;
  });
});

  // 3) Chatbot Toggle
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

  function sendMessage(){
    const txt = chatInput.value.trim();
    if (!txt) return;
    let um=document.createElement('div');
    um.className='chat-msg user'; um.textContent=txt; chatBody.appendChild(um);
    let bm=document.createElement('div');
    bm.className='chat-msg bot'; bm.textContent='응답 준비중…'; chatBody.appendChild(bm);
    chatBody.scrollTop = chatBody.scrollHeight;
    chatInput.value=''; chatInput.focus();
  }
  chatSendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e=>{
    if (e.key==='Enter'){ e.preventDefault(); sendMessage(); }
  });
});


