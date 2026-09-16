import { Router } from "express";
import { createMonitor, getMonitors, getMonitorById, updateMonitor, deleteMonitor} from "./monitor.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js" 
import { requireOrgRole } from "../auth/auth.requireOrgRole.js"; 

const router: Router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", requireOrgRole("OWNER", "ADMIN", "MEMBER", "VIEWER"), getMonitors);

router.post("/", requireOrgRole("OWNER", "ADMIN", "MEMBER"), createMonitor);

router.get("/:monitorId", requireOrgRole("OWNER", "ADMIN", "MEMBER", "VIEWER"), getMonitorById);

router.patch("/:monitorId", requireOrgRole("OWNER", "ADMIN", "MEMBER"), updateMonitor);

router.delete("/:monitorId", requireOrgRole("OWNER", "ADMIN"), deleteMonitor);

export default router;