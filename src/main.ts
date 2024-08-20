import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {BotService} from "./bot/bot.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
    },
  });
  const options = new DocumentBuilder()
    .setTitle('Mining Odyssey API')
    .setVersion('4.5')
    .addServer('/', 'Local environment')
    .build();
  const bot = app.get(BotService)
  try {
    bot.startBot()
  } catch (err) {
    console.log(err)
    bot.startBot()
  }
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(3000);
}
bootstrap();
