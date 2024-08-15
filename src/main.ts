import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'process';

async function bootstrap() {
  console.log(
    process.env.DATABASE_USER,
    process.env.DATABASE_NAME,
    process.env.DATABASE_HOST,
    process.env.DATABASE_USER,
  );
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
    },
  });
  const options = new DocumentBuilder()
    .setTitle('MiningOdyssey API')
    .setVersion('1.0')
    .addServer('/', 'Local environment')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(3000);
}
bootstrap();
