const scriptURL = 'PASTE_GOOGLE_SCRIPT_URL_HERE'; // Ganti dengan URL Web App dari Google Apps Script
const questions = [
  "Apakah display produk rapi?",
  "Apakah stok tersedia?",
  "Apakah SPG hadir di outlet?",
  "Apakah ada promosi berjalan?"
];

const dynamicContainer = document.getElementById('dynamic-questions');

questions.forEach((question, index) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-6 border-b pb-4';
  wrapper.innerHTML = `
    <p class="mb-2 font-semibold">${question}</p>
    <textarea class="w-full border p-2 mb-2" id="answer-${index}" placeholder="Jawaban..."></textarea>
    <video id="video-${index}" autoplay class="w-full h-48 bg-black mb-2"></video>
    <button type="button" class="bg-blue-600 text-white px-3 py-1 rounded mb-2" data-index="${index}">Ambil Foto</button>
    <canvas id="canvas-${index}" class="hidden"></canvas>
    <img id="photo-${index}" class="mt-2 hidden" />
  `;
  dynamicContainer.appendChild(wrapper);
});

// Akses Kamera Sekali (shared stream)
let sharedStream = null;
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    sharedStream = stream;
    questions.forEach((_, i) => {
      const video = document.getElementById(`video-${i}`);
      video.srcObject = stream;
    });
  });

// Lokasi GPS
navigator.geolocation.getCurrentPosition(pos => {
  document.getElementById('location').value = `${pos.coords.latitude},${pos.coords.longitude}`;
});

// Event Capture Foto Tiap Pertanyaan
dynamicContainer.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    const index = e.target.dataset.index;
    const video = document.getElementById(`video-${index}`);
    const canvas = document.getElementById(`canvas-${index}`);
    const photo = document.getElementById(`photo-${index}`);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    photo.src = dataURL;
    photo.classList.remove('hidden');
  }
});

document.getElementById('visit-form').addEventListener('submit', e => {
  e.preventDefault();

  const answers = questions.map((q, i) => ({
    question: q,
    answer: document.getElementById(`answer-${i}`).value,
    photo: document.getElementById(`photo-${i}`).src || ""
  }));

  const data = {
    surveyor: document.getElementById('surveyor').value,
    outlet: document.getElementById('outlet').value,
    location: document.getElementById('location').value,
    answers
  };

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(() => {
    alert('Data berhasil dikirim ke Google Sheet.');
    generatePDF(data);
  })
  .catch(err => alert('Gagal kirim: ' + err.message));
});

function generatePDF(data) {
  const win = window.open('', '', 'height=800,width=600');
  win.document.write('<html><head><title>Hasil Kunjungan</title></head><body>');
  win.document.write('<h2>Hasil Kunjungan Outlet</h2>');
  win.document.write(`<p><strong>Surveyor:</strong> ${data.surveyor}</p>`);
  win.document.write(`<p><strong>Outlet:</strong> ${data.outlet}</p>`);
  win.document.write(`<p><strong>Lokasi:</strong> ${data.location}</p>`);

  data.answers.forEach(a => {
    win.document.write(`<hr/><p><strong>${a.question}</strong><br/>Jawaban: ${a.answer}</p>`);
    if (a.photo) {
      win.document.write(`<img src="${a.photo}" style="max-width:100%;margin-top:10px"/>`);
    }
  });

  win.document.write('</body></html>');
  win.document.close();
  win.print();
}