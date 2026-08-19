import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import walletController from '../controllers/walletController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', walletController.getWallet);
router.post('/add-money', walletController.addMoney);
router.post('/cash-out', walletController.cashOut);
router.get('/transactions', walletController.getTransactions);
router.get('/monitor', walletController.monitorBalance);
router.get('/payout-schedules', walletController.getPayoutSchedules);
router.post('/payout-schedules', walletController.createPayoutSchedule);
router.put('/payout-schedules/:scheduleId', walletController.updatePayoutSchedule);
router.delete('/payout-schedules/:scheduleId', walletController.deletePayoutSchedule);
router.post('/payout-schedules/:scheduleId/mark-paid', walletController.markPayoutPaid);

export default router;
