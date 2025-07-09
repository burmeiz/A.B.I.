const { google } = require('googleapis');
const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json'); // Ajuste o caminho se necessário

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

const auth = new google.auth.GoogleAuth({
  keyFile: './serviceAccountKey.json',
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function createSpreadsheetForUser(uid, userEmail) {
  const copyResponse = await drive.files.copy({
    fileId: 'https://docs.google.com/spreadsheets/d/1Mv88vQ25flGZ5qnru95ob-Lk4YzEgvbMSad_IB_XLgw/edit?usp=sharing',
    requestBody: {
      name: `Boletim - ${userEmail}`,
    },
  });

  const newFileId = copyResponse.data.id;

  await firestore.collection('users').doc(uid).set({ sheetId: newFileId }, { merge: true });

  return newFileId;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'uid e email são obrigatórios' });
  }

  try {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data().sheetId) {
      return res.json({ sheetId: userDoc.data().sheetId });
    }

    const sheetId = await createSpreadsheetForUser(uid, email);
    res.json({ sheetId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar planilha' });
  }
};
