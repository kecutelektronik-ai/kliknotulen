// Serverless Function Vercel untuk Integrasi Google Gemini AI
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
    const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    return res.status(200).json({
      status: 'ok',
      hasServerKey,
      message: hasServerKey
        ? 'API Google Gemini siap digunakan (Server Key Vercel Aktif).'
        : 'Belum ada GEMINI_API_KEY di pengaturan Environment Variables Vercel.'
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

    const { prompt, model = 'gemini-1.5-flash', agenda, pimpinan, peserta, transcript } = body;
    const apiKey = (req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(400).json({
        error: 'API_KEY_MISSING',
        message: 'Kunci API Google Gemini belum diatur. Masukkan API Key di menu "AI Gemini" pada aplikasi atau tambahkan GEMINI_API_KEY di dashboard Vercel (Settings -> Environment Variables).'
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
    "Poin keputusan atau kesepakatan rapat nomor 2"
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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(apiUrl, {
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

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      let parsedErr;
      try {
        parsedErr = JSON.parse(errText);
      } catch (e) {
        parsedErr = { error: { message: errText } };
      }
      return res.status(geminiRes.status).json({
        error: 'GEMINI_API_ERROR',
        status: geminiRes.status,
        message: parsedErr.error?.message || 'Gagal menghubungi Google Gemini API.',
        details: parsedErr
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
