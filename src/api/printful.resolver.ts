import { Resolver, Query } from '@nestjs/graphql';
import { Permission, Allow, RequestContext, Ctx } from '@vendure/core';
import { PrintfulService } from '../service/printful.service';

@Resolver()
export class PrintfulResolver {
    constructor(private printfulService: PrintfulService) {}

    @Query()
    @Allow(Permission.SuperAdmin)
    async importPrintfulProducts(@Ctx() ctx: RequestContext): Promise<void> {
        this.printfulService.importPrintfulProducts(ctx);
    }
}
