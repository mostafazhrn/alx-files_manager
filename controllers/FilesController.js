import fs from 'fs';
import Queue from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import { findUserByToken } from '../utils/helper_controller';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async upPst(req, res) {
    const ficheQue = new Queue('fileQueue');
    const idUsr = await findUserByToken(req);
    if (!idUsr) return res.status(401).send({ error: 'Unauthorized' });
    let insFile;

    const { name } = req.body;
    if (!name) return res.status(400).send({ error: 'Missing name' });
    const { type } = req.body;
    if (!type || !['folder', 'file', 'image'].includes(type)) { return res.status(400).json({ error: 'Missing type' }); }
    const isPublic = req.body.isPublic || false;
    const parentId = req.body.parentId || 0;
    const { data } = req.body;
    if (!data && !['folder'].includes(type)) { return res.status(400).json({ error: 'Missing data' }); }

    if (parentId !== 0) {
      const arrayPadre = await dbClient.files.find({ _id: ObjectID(parentId) }).toArray();
      if (arrayPadre.length === 0) return res.status(400).json({ error: 'Parent not found' });
      const fiche = arrayPadre[0];
      if (fiche.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });
    if (type === 'folder') {
      insFile = await dbClient.files.insertOne({
        idUsr: ObjectID(idUsr),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? parentId : ObjectID(parentId),
      });
    } else {
      const pthFold = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(pthFold)) fs.mkdirSync(pthFold, { recursive: true }, () => {});
      const fnameUUid = uuidv4();
      const locPth = `${pthFold}/${fnameUUid}`;
      const donneClr = Buffer.from(data, 'base64');
      await fs.promises.writeFile(locPth, donneClr.toString(), { flag: 'w+' });
      await fs.readdirSync('/').forEach((file) => {
        console.log(file);
      });

      insFile = await dbClient.files.insertOne({
        idUsr: ObjectID(idUsr),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? parentId : ObjectID(parentId),
        locPth,
      });

      if (type === 'image') {
        await fs.promises.writeFile(locPth, donneClr, { flag: 'w+', encoding: 'binary' });
        await ficheQue.add({ idUsr, fileId: insFile.insertedId, locPth });
      }
    }
    return res.status(201).json({
      id: insFile.ops[0]._id, idUsr, name, type, isPublic, parentId,
    });
  }

  static async showGet(req, res) {
    const tekken = req.headers['x-token'];
    if (!tekken) { return res.status(401).json({ error: 'Unauthorized' }); }
    const cleId = await redisClient.get(`auth_${tekken}`);
    if (!cleId) { return res.status(401).json({ error: 'Unauthorized' }); }
    const usr = await dbClient.db.collection('users').findOne({ _id: ObjectID(cleId) });
    if (!usr) { return res.status(401).json({ error: 'Unauthorized' }); }

    const ficheId = req.params.id || '';
    const docFiche = await dbClient.db.collection('files').findOne({ _id: ObjectID(ficheId), idUsr: usr._id });
    if (!docFiche) { return res.status(404).json({ error: 'Not found' }); }
    return res.send({
      id: docFiche._id,
      userId: docFiche.idUsr,
      name: docFiche.name,
      type: docFiche.type,
      isPublic: docFiche.isPublic,
      parentId: docFiche.parentId,
    });
  }

  static async indexGet(req, res) {
    const tekken = req.headers['x-token'];
    if (!tekken) { return res.status(401).json({ error: 'Unauthorized' }); }
    const cleId = await redisClient.get(`auth_${tekken}`);
    if (!cleId) { return res.status(401).json({ error: 'Unauthorized' }); }
    const parentId = req.query.parentId || '0';
    const pagina = req.query.page || 0;
    const usr = await dbClient.db.collection('users').findOne({ _id: ObjectID(cleId) });
    if (!usr) res.status(401).json({ error: 'Unauthorized' });

    const matchAggr = { $and: [{ parentId }] };
    let donneAggre = [
      { $match: matchAggr },
      { $skip: pagina * 20 },
      { $limit: 20 },
    ];
    if (parentId === 0) donneAggre = [{ $skip: pagina * 20 }, { $limit: 20 }];
    const fiches = await dbClient.db.collection('files').aggregate(donneAggre);
    const fichesArray = [];
    await fiches.forEach((item) => {
      const ficheItm = {
        id: item._id,
        userId: item.idUsr,
        name: item.name,
        type: item.type,
        isPublic: item.isPublic,
        parentId: item.parentId,
      };
      fichesArray.push(ficheItm);
    });
    return res.send(fichesArray);
  }
}
module.exports = FilesController;
