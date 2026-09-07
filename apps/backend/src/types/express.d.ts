import type { OrgMembership } from "../../generated/prisma/browser.ts";

declare global {
    namespace Express {
        interface Request {
            user: {
                userId: string;
                organizationId: string;
                role: string;
            };
            membership?: OrgMembership;
        }
    }
}

export {};