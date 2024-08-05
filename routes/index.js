import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/users/me', UsersController.idGtme);
router.post('/users', UsersController.nuevoPst);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

module.exports = router;
