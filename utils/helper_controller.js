import dbClient from './db';
import redisClient from './redis';

async function authGetTok(req) {
  const tekken = req.headers['x-token'];
  return `auth_${tekken}`;
}

async function findUserByToken(req) {
  const key = await authGetTok(req);
  const idUsr = await redisClient.get(key);
  return idUsr || null;
}

async function findUserByEmail(idUsr) {
  const arrayExist = await dbClient.users.find(`ObjectId("${idUsr}")`).toArray();
  return arrayExist[0] || null;
}

export {
  findUserByToken,
  findUserByEmail,
};
