declare module 'swagger-jsdoc' {
  function swaggerJsdoc(options: any): any;
  export = swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  const serve: any;
  const setup: any;
  export { serve, setup };
}
