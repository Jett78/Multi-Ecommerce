import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionService } from '../modules/permission/permission.service';
import { DB_CONNECTION } from '../db/db.module';
import { user as userTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

interface CachedSession {
  user: { id: string; role: string };
  expiresAt: number;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  private readonly sessionCache = new Map<string, CachedSession>();
  private readonly CACHE_TTL = 60 * 1000;

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<Record<string, never>>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    const sessionCookie = headers?.cookie;
    if (!sessionCookie) {
      throw new ForbiddenException('Authentication required');
    }

    const cacheKey = this.extractSessionToken(sessionCookie);
    let session: { user: { id: string; role: string } } | null = null;

    if (cacheKey) {
      const cached = this.sessionCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        session = { user: cached.user };
        this.logger.debug(`Session cache hit for user ${session.user.id}`);
      }
    }

    if (!session) {
      const { auth } = await import('../lib/auth');
      
      try {
        const sessionResult = await auth.api.getSession({
          headers: headers as any,
        });
        
        if (!sessionResult?.user) {
          throw new ForbiddenException('Authentication required');
        }

        session = {
          user: {
            id: sessionResult.user.id,
            role: sessionResult.user.role || 'customer',
          },
        };
      } catch {
        throw new ForbiddenException('Authentication required');
      }

      if (!session?.user) {
        throw new ForbiddenException('Authentication required');
      }

      if (cacheKey) {
        this.sessionCache.set(cacheKey, {
          user: { id: session.user.id, role: session.user.role },
          expiresAt: Date.now() + this.CACHE_TTL,
        });
      }
    }

    const userId = session.user.id;
    
    const userRecord = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!userRecord.length) {
      throw new ForbiddenException('User not found');
    }

    if (userRecord[0].role === 'super_admin') {
      this.logger.debug(`Permission check took ${Date.now() - startTime}ms (super_admin bypass)`);
      return true;
    }

    const hasPermissions = await this.permissionService.checkPermissions(
      userId,
      requiredPermissions,
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    this.logger.debug(`Permission check took ${Date.now() - startTime}ms for user ${userId}`);
    return true;
  }

  private extractSessionToken(cookieHeader: string): string | null {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    return match ? match[1] : null;
  }
}
