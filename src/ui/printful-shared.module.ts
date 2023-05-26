import { NgModule } from '@angular/core';
import { SharedModule, addActionBarItem } from '@vendure/admin-ui/core';
import { gql } from 'graphql-tag';

@NgModule({
    imports: [SharedModule],
    providers: [
        addActionBarItem({
            id: 'import-printful-products',
            label: 'Import Printful Products',
            locationId: 'product-list',
            buttonStyle: 'outline',
            requiresPermission: 'SuperAdmin',
            onClick: (_, { dataService, notificationService }) => {
                dataService
                    .query(
                        gql`
                            query {
                                importPrintfulProducts
                            }
                        `,
                    )
                    .single$.subscribe(_ => {
                        notificationService.success(
                            'Imported Products from Printful! \nPlease rebuild search index for changes.',
                        );
                    });
            },
        }),
    ],
})
export class PrintfulSharedModule {}
