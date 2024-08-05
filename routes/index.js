import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.id_gtme);
router.post('/users', UsersController.nuevo_pst);
router.get('/files', FilesController.indexGet);
router.get('/files/:id', FilesController.showGet);
router.post('/files', FilesController.upPst);

module.exports = router;
