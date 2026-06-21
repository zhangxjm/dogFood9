const express = require('express');
const router = express.Router();
const { Operation, WhiteboardUser } = require('../models');
const { authMiddleware, requireWhiteboardPermission } = require('../middleware');

router.use(authMiddleware);

router.get('/:id/operations', requireWhiteboardPermission('read'), (req, res) => {
  const { id } = req.params;
  const { since_seq, limit } = req.query;

  const limitNum = Math.min(parseInt(limit) || 100, 500);

  let operations;
  if (since_seq !== undefined) {
    operations = Operation.findByWhiteboardSinceSeq(id, parseInt(since_seq), limitNum);
  } else {
    operations = Operation.findByWhiteboard(id, limitNum);
  }

  res.json({
    operations,
    total: operations.length
  });
});

router.get('/:id/operations/max-seq', requireWhiteboardPermission('read'), (req, res) => {
  const { id } = req.params;
  const maxSeq = Operation.getMaxSeq(id);
  res.json({ max_seq: maxSeq });
});

module.exports = router;
