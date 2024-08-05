import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const Auth = req.header('Authorization') || '';
    const cred = Auth.split(' ')[1];
    if (!cred) return res.status(401).send({ error: 'Unauthorized' });
    const credDecoded = Buffer.from(cred, 'base64').toString('utf-8');

    const [email, password] = credDecoded.split(':');
    if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });

    const hashedPassword = sha1(password);
    const credFin = { email, password: hashedPassword };
    const usr = await dbClient.users.findOne(credFin);
    if (!usr) return res.status(401).send({ error: 'Unauthorized' });

    const tekken = uuidv4();
    const cle = `auth_${tekken}`;
    const timeExpire = 24;
    await redisClient.set(cle, usr._id.toString(), timeExpire * 3600);

    return res.status(200).send({ token: tekken });
  }

  static async getDisconnect(req, res) {
    const tekken = req.header('X-Token');
    if (!tekken) return res.status(401).send({ error: 'Unauthorized' });

    const usrId = await redisClient.get(`auth_${tekken}`);
    if (!usrId) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(`auth_${tekken}`);
    return res.status(204).send();
  }
}
module.exports = AuthController;
