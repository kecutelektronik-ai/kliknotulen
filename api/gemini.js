// Serverless Function Vercel untuk Integrasi Google Gemini AI
const DEFAULT_KEY_B64 = 'QVEuQWI4Uk42SmtfNFV3NjZyenZpM29ncXhVcExGSjI4MlZQZC1NazliMjZPbXpxbWhYY0E=';
const FALLBACK_KEY = Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf8');

export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check / Status check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      hasServerKey: true,
      message: 'API Google Gemini siap digunakan (Kunci Serverless Otomatis Aktif).'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { prompt, model = 'gemini-3.5-flash-lite', agenda, pimpinan, peserta, transcript } = body;
    const apiKey = (req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || FALLBACK_KEY).trim();

    if (!apiKey) {
      return res.status(400).json({
        error: 'API_KEY_MISSING',
        message: 'Kunci API Google Gemini belum diatur.'
      });
    }

    let finalPrompt = prompt;
    if (!finalPrompt) {
      finalPrompt = `Anda adalah notulis dinas resmi profesional pemerintah dan peradilan Indonesia.
Tugas Anda adalah merangkum dan menyusun naskah notulen rapat resmi berdasarkan data aktual berikut:
- Agenda Rapat: ${agenda || 'Rapat Dinas'}
- Pimpinan Rapat: ${pimpinan || 'Pimpinan Rapat'}
- Peserta Hadir: ${peserta || 'Pimpinan dan Seluruh Peserta Hadir'}
- Transkrip Percakapan / Suara Rapat:
"""
${transcript || 'Rapat dibuka oleh pimpinan rapat, dilanjutkan pembahasan agenda dan masukan dari para peserta rapat.'}
"""

Instruksi Khusus:
1. Jangan membuat data palsu tentang server, IT cluster RAM, atau pihak lain yang tidak berkaitan dengan agenda rapat di atas.
2. Gunakan Bahasa Indonesia baku, formal, dan berstandar administrasi dinas resmi (A4).
3. Tandai kata atau angka yang meragukan/kurang terdengar jelas dengan format: <span class="unclear-marker" onclick="editMarkerText(this)">[⚠️ Suara Kurang Jelas: "perkiraan kata/angka"]</span>.
4. Format output WAJIB HANYA berupa JSON murni tanpa pembungkus markdown apapun (jangan gunakan \`\`\`json):

{
  "pembukaan": "Paragraf narasi pembukaan rapat dan arahan pimpinan rapat secara formal dan lengkap.",
  "pembahasan_poin": [
    "<strong>Nama/Jabatan Pembicara:</strong> Pokok paparan, tanggapan, atau usulan penting yang disampaikan",
    "<strong>Nama/Jabatan Pembicara:</strong> Pokok bahasan berikutnya"
  ],
  "keputusan_poin": [
    "Poin keputusan atau kesepakatan rapat nomor 1",
    "Poin keputusan atau kesepakatan rapat nomor 2",
    "Poin keputusan atau kesepakatan rapat nomor 3",
    "Poin keputusan atau kesepakatan rapat nomor 4"
  ],
  "tindak_lanjut": [
    {
      "kegiatan": "Uraian tugas atau kegiatan tindak lanjut",
      "pic": "Pejabat/Unit Penanggung Jawab",
      "deadline": "Target Waktu Penyelesaian"
    }
  ],
  "diarization": [
    {
      "nama": "Nama Pembicara",
      "waktu": "00:30",
      "status": "ok",
      "teks": "Ringkasan ringkas pernyataan yang disampaikan."
    }
  ]
}`;
    }

    // Daftar kandidat model Google Gemini dengan fallback otomatis
    const candidateModels = [
      model,
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ].filter(Boolean);
    const uniqueModels = [...new Set(candidateModels)];

    let geminiRes = null;
    let lastErrorText = '';

    for (const m of uniqueModels) {
      const cleanModel = m.replace(/^models\//, '');
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8
            }
          })
        });

        if (response.ok) {
          geminiRes = response;
          break;
        } else {
          lastErrorText = await response.text();
        }
      } catch (err) {
        lastErrorText = err.message;
      }
    }

    if (!geminiRes) {
      return res.status(500).json({
        error: 'GEMINI_API_ERROR',
        message: 'Gagal menghubungi Google Gemini API setelah mencoba beberapa model.',
        details: lastErrorText
      });
    }

    const data = await geminiRes.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Bersihkan wrapper markdown jika ada
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Cari pola JSON object { ... }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(rawText);
      return res.status(200).json({ success: true, data: parsed });
    } catch (parseErr) {
      return res.status(200).json({ success: true, text: rawText });
    }
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
}
