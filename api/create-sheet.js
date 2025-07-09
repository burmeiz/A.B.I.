const { google } = require('googleapis'); 
const admin = require('firebase-admin');

// Lê a chave da variável de ambiente e faz parse do JSON
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

const auth = new google.auth.GoogleAuth({
  // Usa a chave em memória, não arquivo físico
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function createSpreadsheetForUser(uid, userEmail) {
  // Coloque aqui só o ID da planilha original (sem URL)
  const TEMPLATE_SHEET_ID = '1Mv88vQ25flGZ5qnru95ob-Lk4YzEgvbMSad_IB_XLgw';

  // Faz uma cópia da planilha modelo para o usuário
  const copyResponse = await drive.files.copy({
    fileId: TEMPLATE_SHEET_ID,
    requestBody: {
      name: `Boletim - ${userEmail}`,
    },
  });

  const newFileId = copyResponse.data.id;

  // Salva o ID da planilha no Firestore para o usuário
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
      // Retorna a planilha já criada
      return res.json({ sheetId: userDoc.data().sheetId });
    }

    // Cria nova planilha
    const sheetId = await createSpreadsheetForUser(uid, email);
    res.json({ sheetId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar planilha' });
  }
};
