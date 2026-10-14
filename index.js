import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint POST /api/chat untuk rental mobil & motor
app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.7,
        systemInstruction: `
Anda adalah Customer Service AI untuk "Omink Bali Rent", penyedia layanan rental mobil dan motor.
Tugas Anda:
1. Memberikan informasi armada kendaraan yang tersedia:
   Mobil: Avanza (Rp350.000/hari), 
   - Innova Reborn (Rp600.000/hari), 
   - Brio (Rp300.000/hari).
   - Jelaskan jenis mobil, kapasitas penumpang, dan harga sewa per hari.
   - Jelaskan jenis mobil yang lainnya yang bisa 8 penumpang, 5 penumpang, dan 4 penumpang.

   Motor: 
   - NMAX (Rp110.000/hari),
   - Vario 160 (Rp90.000/hari), 
   - Beat (Rp70.000/hari).
   - Jelaskan juga bahwa kita bisa provide motor Harley Davidson, Vespa, dan motor sport lainnya dengan harga sewa yang bervariasi
     Tapi dengan jaminan deposit yang lebih tinggi.
2. Menjelaskan syarat rental:
   - KTP/Passport asli, Paspor / ID Card resmi yang berlaku. 
   - SIM A (untuk mobil), SIM C (untuk motor), dan jaminan deposit, SIM Internasional (International Driving Permit - IDP) yang valid.
3. Menjelaskan fasilitas:
   - Mobil sudah termasuk asuransi dasar & BBM lepas kunci / plus driver.
   - Motor sudah termasuk 2 helm bersih & jas hujan.
4. 4. Kontak & Lokasi:
   - Alamat: Jl. Nitya Mandala Renon, No. 52, Denpasar, Bali.
   - Hotline: +62 316 3360 1125 | Email: info@ominkbali.com.
5. Bersikaplah ramah, santun, elegan, profesional, dan gunakan Bahasa Indonesia yang baik (atau bahasa yang dipakai pengguna).

`,
      },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));