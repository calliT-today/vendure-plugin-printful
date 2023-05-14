import { Order, PluginCommonModule, TransactionalConnection, VendurePlugin } from '@vendure/core';
import { adminSchema } from './api/api-extensions';
import { PrintfulResolver } from './api/printful.resolver';
import { PLUGIN_INIT_OPTIONS } from './constants';
import { PrintfulClient } from 'printful-client';
import { PrintfulService } from './service/printful.service';
import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm';
import { Injectable } from '@nestjs/common';

export interface PrintfulOptions {
    enabled: boolean;
}

@Injectable()
@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
    constructor(private connection: TransactionalConnection) {
        this.connection.rawConnection.subscribers.push(this);
    }

    listenTo() {
        return Order;
    }

    async afterUpdate(event: UpdateEvent<Order>) {
        if (event.entity?.state !== 'PaymentAuthorized') return;
        try {
            const printfulClient = new PrintfulClient(process.env.PRINTFUL_AUTH_TOKEN as string);
            const orderItems = [];
            for (const line of event.entity?.lines) {
                const printfulOrderItem = {
                    sync_variant_id: line.productVariant.sku,
                    quantity: line.quantity,
                    retail_price: `${line.unitPrice / 100}`,
                };
                orderItems.push(printfulOrderItem);
            }
            const printfulOrder = {
                recipient: {
                    name: event.entity?.shippingAddress?.fullName,
                    address1: event.entity?.shippingAddress?.streetLine1,
                    city: event.entity?.shippingAddress?.city,
                    state_code: event.entity?.shippingAddress?.province.match(/\b\w/g).join(''),
                    country_code: event.entity?.shippingAddress?.countryCode,
                    zip: event.entity?.shippingAddress?.postalCode,
                },
                items: orderItems,
            };
            await printfulClient.orders.create(printfulOrder);
        } catch (e) {
            console.log(e);
        }
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        {
            provide: PLUGIN_INIT_OPTIONS,
            useFactory: () => PrintfulPlugin.options,
        },
        PrintfulService,
        OrderSubscriber,
    ],
    adminApiExtensions: {
        resolvers: [PrintfulResolver],
        schema: adminSchema,
    },
})
export class PrintfulPlugin {
    static options: PrintfulOptions;

    static init(options: PrintfulOptions) {
        this.options = options;
        return PrintfulPlugin;
    }
}
