'use strict';
/** Requires */
import express      from 'express';
import exa          from 'exa';

/** Init */
const router = exa(express.Router());

router.$get('/:template', async function (req, res) {
  const {template} = req.params;

  res.render(`templates/${template}.jade`);
});

export default router;
