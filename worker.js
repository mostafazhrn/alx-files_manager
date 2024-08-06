import DBClient from './utils/db';
const Bull = require('bull');
const { ObjectId } = require('mongodb');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const fileQueue = new Bull('fileQueue');

// continue the code here
const userQueue = new Bull('userQueue');
const createThumbnail = async (pth, ops) => {
  try {
    const thumbn = await imageThumbnail(pth, ops);
    const nailPth = `${pth}_${ops.width}`;

    await fs.writeFileSync(nailPth, thumbn);
    } catch (err) {
      console.log(err);
    }
};

fileQueue.process(async (job) => {
  const { userId } = job.data;
  const user = await DBClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) throw new Error('User not found');
  console.log(`Welcome ${user.email}`);
});
