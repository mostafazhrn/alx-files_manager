import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/users/me', UsersController.idGtme);
router.post('/users', UsersController.nuevoPst);

module.exports = router;
