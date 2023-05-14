import { gql } from 'graphql-tag';

export const adminSchema = gql`
    extend type Query {
        importPrintfulProducts: String
    }
`;
