## Printful Vendure Plugin

![Vendure version](https://img.shields.io/npm/dependency-version/@callit-today/vendure-plugin-printful/dev/@vendure/core)

Import Printful products and start selling!


# Getting started

`yarn add @callit-today/vendure-plugin-printful`

\
&nbsp;
Add your `PRINTFUL_AUTH_TOKEN` to `.env` and run import GraphQL query in admin-api

```graphql
{
  importPrintfulProducts
}
```
\
&nbsp;

## How it works

The plugin uses `FastImporterSerivce` to import products from Printful. Remember to rebuild search index after import completes. When an order is completed, a draft order is created in Printful. 

&nbsp;

## Next steps

Confirm the order in Printful for fulfillment.

&nbsp;

## Todo

Add config option for auto confirming orders on Printful.

\
&nbsp;

## License

MIT
