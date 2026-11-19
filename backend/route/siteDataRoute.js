const router = require('express').Router();
const authenticateToken = require('../middleware/authenticate');
const c = require('../controller/siteDataController');

router.get('/:siteId/data',                     authenticateToken, c.sections);
router.get('/:siteId/data/schema',              authenticateToken, c.schema);
router.get('/:siteId/data/:resource',           authenticateToken, c.list);
router.post('/:siteId/data/:resource',          authenticateToken, c.create);
router.put('/:siteId/data/:resource/:id',       authenticateToken, c.update);
router.delete('/:siteId/data/:resource/:id',    authenticateToken, c.remove);

module.exports = router;