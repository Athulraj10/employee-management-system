import swaggerJSDoc from 'swagger-jsdoc';

export function buildSwaggerSpec() {
  const options: swaggerJSDoc.Options = {
    definition: {
      openapi: '3.1.0',
      info: {
        title: 'Enterprise EMS & PMS API',
        version: '1.0.0',
        description:
          'Enterprise Employee Management & Performance Management System APIs (EMS & PMS)',
      },
      servers: [
        {
          url: '/api',
        },
      ],
    },
    apis: ['src/modules/**/*.routes.ts', 'src/modules/**/*.controller.ts'],
  };

  return swaggerJSDoc(options);
}


