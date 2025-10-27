const fs = require('fs');
const path = require('path');

const REDACTION_FILE = path.join(__dirname, '../../data/redaction.json');

// Charger toutes les données (documents + template)
function loadData() {
  try {
    if (!fs.existsSync(REDACTION_FILE)) {
      return { documents: [], template: null };
    }
    const data = fs.readFileSync(REDACTION_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      documents: parsed.documents || [],
      template: parsed.template || null
    };
  } catch (error) {
    console.error('Erreur lecture redaction.json:', error);
    return { documents: [], template: null };
  }
}

// Sauvegarder toutes les données
function saveData(documents, template) {
  try {
    const data = { documents, template };
    fs.writeFileSync(REDACTION_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erreur écriture redaction.json:', error);
    throw new Error('Impossible de sauvegarder les données');
  }
}

// Charger les documents
function loadDocuments() {
  return loadData().documents;
}

// Sauvegarder les documents
function saveDocuments(documents) {
  const { template } = loadData();
  saveData(documents, template);
}

// Récupérer tous les documents
function getAllDocuments() {
  return loadDocuments();
}

// Récupérer un document par ID
function getDocumentById(id) {
  const documents = loadDocuments();
  return documents.find(doc => doc.id === id);
}

// Sauvegarder un document (créer ou modifier)
function saveDocument(document) {
  let documents = loadDocuments();
  
  // Si l'ID existe, mise à jour
  const index = documents.findIndex(doc => doc.id === document.id);
  
  if (index !== -1) {
    documents[index] = {
      ...documents[index],
      ...document,
      date: new Date().toISOString()
    };
  } else {
    // Nouveau document
    if (!document.id) {
      document.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    document.date = new Date().toISOString();
    documents.push(document);
  }
  
  saveDocuments(documents);
  return document;
}

// Supprimer un document
function deleteDocument(id) {
  let documents = loadDocuments();
  documents = documents.filter(doc => doc.id !== id);
  saveDocuments(documents);
}

// Récupérer le template
function getTemplate() {
  return loadData().template;
}

// Sauvegarder le template
function saveTemplate(template) {
  const documents = loadDocuments();
  saveData(documents, template);
}

module.exports = {
  getAllDocuments,
  getDocumentById,
  saveDocument,
  deleteDocument,
  getTemplate,
  saveTemplate
};
