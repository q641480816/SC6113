const cluster = require('cluster');
const os = require('os');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser')
const { flush, hsetGet, hsetMassGet, hsetMassSet, hgetAll } = require('./redisClient');
const { compileVote, startCampaign, endCampaign, castVote, validateContract, setUploaderWithAddress, getCampaignResults, verifyMerkleProof, checkPendingCount } = require('./voteService');
const { getAvaliableUploader } = require('./web3Utils');
const Constants = require('./constants').Constants;
const properties = require('./properties.json');
const cors = require('cors')

const numCPUs = os.cpus().length > 5 ? os.cpus().length - 4 : os.cpus().length;
cluster.schedulingPolicy = cluster.SCHED_RR;
const corsOptions = {
  origin: `http://localhost:7636`,
  optionsSuccessStatus: 200
}

if (cluster.isPrimary) {
  // flush()
  const uploaderTable = 'uploader';
  const clusterMap = {};
  const totalVoteCount = {};

  require('./logger').info('Master instance started!');
  flush()
    .then(res => require('./logger').info('Redis has been flushed!!!'))
    .catch(err => require('./logger').error('Failed to flush Redis'));


  const uploader = {};
  properties.uploaders.forEach(u => uploader[u] = true);
  hsetMassSet(uploaderTable, uploader)
    .then(res => { })
    .catch(err => console.log(err));

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    clusterMap[worker.id] = worker;
    worker.on('message', (msg) => {
      if (msg.type === 'request') {
        if (msg.data === 'getAvaliableUploader') {
          getAvaliableUploader()
            .then(pk => worker.send({ type: 'response', id: msg.id, data: pk }))
            .catch(err => worker.send({ type: 'error', id: msg.id, error: err }))
        } else if (msg.data.name === 'checkPendingCount') {
          checkPendingCount(msg.data.data)
            .then(votes => worker.send({ type: 'response', id: msg.id, data: votes }))
            .catch(err => worker.send({ type: 'error', id: msg.id, error: err }))
        } else if (msg.data.name === 'vote') {
          if (!totalVoteCount[msg.data.data]) totalVoteCount[msg.data.data] = 0;
          totalVoteCount[msg.data.data] = totalVoteCount[msg.data.data] + 1;
          if (totalVoteCount[msg.data.data] >= properties.countThreshhold) {
            totalVoteCount[msg.data.data] = totalVoteCount[msg.data.data] - properties.countThreshhold;
            let worker = Object.values(clusterMap)[Math.floor(Object.keys(clusterMap).length * Math.random())];
            worker.send({ type: 'execute', data: msg.data.data })
          }
        }
      }
    });
  }

  cluster.on('exit', (worker, code, signal) => {
    require('./logger').info('Labor instance dead...')
  });
} else {
  process.on('message', (msg) => {
    if (msg.type === 'execute') {
      setTimeout(() => compileVote(msg.data), Math.random() * 500);
    }
  });

  const app = express();
  const jsonParser = bodyParser.json();
  // app.use(cors(corsOptions));
  app.use('/', express.static(path.join(__dirname, 'public')));

  app.get('/', async (req, res) => {
    const rc = await hsetMassGet('1pending', 'aaa', 'bbb', 'ccc');
    res.send(JSON.stringify(rc));
  });

  app.get('/test', async (req, res) => {
    validateContract();
    res.send("OK");
  });

  app.post('/setUploader', jsonParser, async (req, res) => {
    let result = await setUploaderWithAddress(req.body.address);
    res.send("OK");
  });

  app.post('/getCampaignResults', jsonParser, async (req, res) => {
    try {
      const campaign = await hsetGet(properties.tables.campaignMap, req.body.id);
      const result = await getCampaignResults(req.body.id);
      if (campaign) {
        res.send({
          ...JSON.parse(campaign),
          results: result.map(c => Number(c))
        });
      } else {
        res.send({})
      }
    } catch (err) {
      res.status(500).send({
        error: err.message
      })
    }
  });

  app.post('/cast', jsonParser, (req, res) => {
    castVote(req.body.address, req.body.message, req.body.campianId, req.body.signature)
      .then(r => res.send({ res: 'Voted!' }))
      .catch(err => res.status(500).send({ err: err.message }));
  })

  app.post('/getUserVoteByCampaign', jsonParser, (req, res) => {
    getUserVoteByCampaign(req.body.address, req.body.campianId)
      .then(r => res.send(r))
      .catch(err => res.status(500).send(err.message));
  })

  app.post('/verifyMerkleProof', jsonParser, (req, res) => {
    verifyMerkleProof(req.body.address, req.body.voteHash, req.body.merkleProof, req.body.merkleRoot)
      .then(r => res.send(r))
      .catch(err => res.status(500).send(err.message));
  })

  app.listen(properties.port, () => {
    require('./logger').info('Labor instance started!')
  });
}

