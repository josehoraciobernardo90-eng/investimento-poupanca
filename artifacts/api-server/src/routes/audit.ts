import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const entries = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.ts));
  res.json(entries);
});

export default router;
