import _ from 'lodash';
import express, { Request, Response } from 'express';
import logger from '../../logger.js';

const router = express.Router();

import schedulesDB from '../../db/schedules.js';
import {
  DailySchedule,
  DayOfWeek,
  SchedulesSchema,
  Side,
  SideSchedule,
} from '../../db/schedulesSchema.js';
import { Schedules } from '../../db/schedulesSchema.js';
import { partialUtil } from 'zod/lib/helpers/partialUtil';
import DeepPartial = partialUtil.DeepPartial;


router.get('/schedules', async (req: Request, res: Response) => {
  await schedulesDB.read();
  res.json(schedulesDB.data);
});

router.post('/schedules', async (req: Request, res: Response) => {
  const body = req.body;
  const validationResult = SchedulesSchema.deepPartial().safeParse(body);
  if (!validationResult.success) {
    logger.error('Invalid schedules update:', validationResult.error);
    res.status(400).json({
      error: 'Invalid request data',
      details: validationResult?.error?.errors,
    });
    return;
  }
  // @ts-ignore
  const schedules: DeepPartial<Schedules> = validationResult.data;
  await schedulesDB.read();

  (
    Object.entries(schedules) as [Side, Partial<SideSchedule>][]).forEach(([side, sideSchedule]) => {
    (Object.entries(sideSchedule) as [DayOfWeek, Partial<DailySchedule>][]).forEach(([day, schedule]) => {
      if (schedule.power) {
        _.merge(schedulesDB.data[side][day].power, schedule.power);
      }
      if (schedule.temperatures) schedulesDB.data[side][day].temperatures = schedule.temperatures;
      if (schedule.alarm) schedulesDB.data[side][day].alarm = schedule.alarm;
    });
  });
  await schedulesDB.write();
  res.status(200).json(schedulesDB.data);
});


export default router;
