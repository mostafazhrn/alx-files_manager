import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import { findUserByEmail, findUserByToken } from '../utils/helper_controller';

const userQueue = new Queue('userQueue');

class UsersController {
  static async nuevoPst(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const existMail = await dbClient.users.findOne({ email });
    if (existMail) return res.status(400).send({ error: 'Already exist' });

    const hashedPassword = sha1(password);
    let result;
    try {
      result = await dbClient.users.insertOne({ email, password: hashedPassword });
    } catch (err) {
      await userQueue.add({});
      return res.status(500).send({ error: 'Error creating user' });
    }

    const user = {
      id: result.insertedId,
      email,
    };

    await userQueue.add({
      userId: result.insertedId.toString(),
    });

    return res.status(201).send(user);
  }

  static async idGtme(req, res) {
    const tekken = req.headers['x-token'];
    if (!tekken) return res.status(401).json({ error: 'Unauthorized' });

    const idUsr = await findUserByToken(req);
    if (!idUsr) return res.status(401).send({ error: 'Unauthorized' });

    const usr = await findUserByEmail(idUsr);

    if (!usr) return res.status(401).send({ error: 'Unauthorized' });

    const usrProcessed = { id: usr._id, ...usr };
    delete usrProcessed.password;
    delete usrProcessed._id;
    return res.status(200).send(usrProcessed);
  }
}

module.exports = UsersController;
