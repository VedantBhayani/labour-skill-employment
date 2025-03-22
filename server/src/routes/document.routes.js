const express = require('express');
const documentController = require('../controllers/document.controller');
const { validateRequest } = require('../middleware/validation.middleware');
const { documentValidation } = require('../middleware/validators');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get document stats
router.get('/stats', documentController.getDocumentStats);

// CRUD operations for documents
router.route('/')
  .get(documentController.getAllDocuments)
  .post(
    validateRequest(documentValidation.createDocument),
    documentController.createDocument
  );

router.route('/:id')
  .get(documentController.getDocumentById)
  .patch(
    validateRequest(documentValidation.updateDocument),
    documentController.updateDocument
  )
  .delete(documentController.deleteDocument);

// Share document with users
router.post(
  '/:id/share',
  validateRequest(documentValidation.shareDocument),
  documentController.shareDocument
);

module.exports = router; 