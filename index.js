const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Configurações
const TEMPLATE_ID = 'https://docs.google.com/spreadsheets/d/1Mv88vQ25flGZ5qnru95ob-Lk4YzEgvbMSad_IB_XLgw/edit?usp=sharing';
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

const auth = new google.auth.GoogleAuth({
  keyFile: './serviceAccountKey.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

async function createSpreadsheetForUser(uid, userEmail) {
  const copyResponse = await drive.files.copy({
    fileId: TEMPLATE_ID,
    requestBody: {
      name: `Boletim - ${userEmail}`
    }
  });

  const newFileId = copyResponse.data.id;

  await firestore.collection('users').doc(uid).set({ sheetId: newFileId }, { merge: true });

  return newFileId;
}

app.post('/create-sheet', async (req, res) => {
  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'uid e email são obrigatórios' });
  }

  try {
    // Verifica se já existe planilha no Firestore
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data().sheetId) {
      return res.json({ sheetId: userDoc.data().sheetId });
    }

    // Cria nova planilha
    const sheetId = await createSpreadsheetForUser(uid, email);
    res.json({ sheetId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar planilha' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
