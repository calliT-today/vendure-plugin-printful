import { Injectable } from '@nestjs/common';
import {
    Asset,
    AssetService,
    ConfigService,
    FastImporterService,
    LanguageCode,
    ProductService,
    RequestContext,
} from '@vendure/core';
import {
    CreateProductInput,
    CreateProductVariantInput,
    GlobalFlag,
    ProductTranslationInput,
    ProductVariantTranslationInput,
} from '../../generated/generated-types';
import { PrintfulClient } from 'printful-client';
import { normalizeString } from '@vendure/common/lib/normalize-string';

@Injectable()
export class PrintfulService {
    private printfulClient: PrintfulClient;

    constructor(
        private fastImporterService: FastImporterService,
        private configService: ConfigService,
        private assetService: AssetService,
        private productService: ProductService,
    ) {
        this.printfulClient = new PrintfulClient(process.env.PRINTFUL_AUTH_TOKEN as string);
    }

    async getProductList(): Promise<any> {
        try {
            const response = await this.printfulClient.products.getAll();
            return await response.json();
        } catch (err) {
            console.error(err);
        }
    }

    async getProductById(id: string): Promise<any> {
        try {
            const response = await this.printfulClient.products.get(id);
            return await response.json();
        } catch (err) {
            console.error(err);
        }
    }

    async importPrintfulProducts(ctx: RequestContext) {
        await this.fastImporterService.initialize(ctx.channel);
        const { assetImportStrategy } = this.configService.importExportOptions;

        const { result } = await this.getProductList();
        for (const product of result) {
            const existingProduct = await this.productService.findOneBySlug(
                ctx,
                normalizeString(product.name as string, '-'),
            );
            if (!existingProduct) {
                const stream = await assetImportStrategy.getStreamFromPath(product.thumbnail_url);
                const asset = (await this.assetService.createFromFileStream(stream, 'assets', ctx)) as Asset;

                const productTranslation: ProductTranslationInput = {
                    languageCode: LanguageCode.en,
                    name: product.name,
                    slug: product.name,
                    description: 'Imported from Printful',
                };
                const createProductInput: CreateProductInput = {
                    featuredAssetId: asset.id as string,
                    customFields: { printfulProductId: product.id },
                    translations: [productTranslation],
                };
                const productId = await this.fastImporterService.createProduct(createProductInput);

                const { result } = await this.getProductById(product.id);
                for (const productVariant of result.sync_variants) {
                    const stream = await assetImportStrategy.getStreamFromPath(
                        productVariant.files[1].preview_url,
                    );
                    const asset = (await this.assetService.createFromFileStream(
                        stream,
                        'assets',
                        ctx,
                    )) as Asset;

                    const productVariantTranslation: ProductVariantTranslationInput = {
                        languageCode: LanguageCode.en,
                        name: productVariant.name,
                    };
                    const createProductVariantInput: CreateProductVariantInput = {
                        featuredAssetId: asset.id as string,
                        productId: productId as string,
                        translations: [productVariantTranslation],
                        sku: productVariant.id,
                        price: productVariant.retail_price * 100,
                        trackInventory: 'FALSE' as GlobalFlag,
                        taxCategoryId: '1',
                    };
                    await this.fastImporterService.createProductVariant(createProductVariantInput);
                }
            }
        }
    }
}
