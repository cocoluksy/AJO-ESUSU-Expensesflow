import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import contributionController from '../controllers/contributionController.js';

const router = express.Router();

router.use(verifyToken);
router.post('/groups', contributionController.createGroup);
router.get('/groups/public', contributionController.getPublicGroups);
router.get('/groups/mine', contributionController.getUserGroups);
router.post('/groups/:groupId/join', contributionController.joinGroup);
router.post('/groups/:groupId/request-join', contributionController.requestToJoin);
router.post('/groups/:groupId/exit', contributionController.exitGroup);
router.get('/groups/:groupId/summary', contributionController.getGroupContributionsSummary);
router.post('/groups/:groupId/members', contributionController.addGuestMember);
router.delete('/groups/:groupId/members/:memberId', contributionController.removeMember);
router.post('/groups/:groupId/members/:memberId/readd', contributionController.readdMember);
router.put('/groups/:groupId/members/:memberId/payout-date', contributionController.setMemberPayoutDate);
router.post('/contributions', contributionController.addContribution);
router.get('/track', contributionController.trackContribution);
router.get('/notifications', contributionController.getNotifications);
router.get('/personal-savings', contributionController.getPersonalSavings);
router.put('/personal-savings', contributionController.savePersonalSavings);
router.get('/personal-savings/history', contributionController.getPersonalSavingsHistory);
router.post('/personal-savings/history', contributionController.addPersonalSavingsEntry);

export default router;
