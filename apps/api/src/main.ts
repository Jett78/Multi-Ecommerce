import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription(`
## Authentication

This API uses **Better Auth** for authentication with session-based cookies.

### How to Authenticate

1. **Sign up** or **Sign in** using the auth endpoints below
2. The session cookie (\`better-auth.session_token\`) is set automatically
3. Click the **Authorize** button above and enter your session token

### Auth Endpoints (Better Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | \`/api/auth/sign-up/email\` | Register a new user |
| POST | \`/api/auth/sign-in/email\` | Login with email & password |
| POST | \`/api/auth/sign-out\` | Logout (invalidate session) |
| GET | \`/api/auth/get-session\` | Get current session |
| GET | \`/api/auth/ok\` | Health check |

### Sign In Request
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### Response Format
\`\`\`json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "session": {
    "id": "session-id",
    "token": "session-token",
    "userId": "user-uuid",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
}
\`\`\`

**Note:** After sign-in, copy the session token and paste it in the Authorize dialog.
    `)
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .addSecurityRequirements('cookie')
    .addTag('auth', 'Authentication endpoints (profile)')
    .addTag('blogs', 'Blog management')
    .addTag('upload', 'File upload to S3')
    .addTag('company-profile', 'Company profile management')
    .addTag('testimonials', 'Testimonial management')
    .addTag('inquiries', 'Inquiry management')
    .addTag('seo', 'Global SEO settings (meta tags, GTM, Search Console)')
    .addTag('page-seo', 'Per-page SEO settings')
    .addTag('products', 'Product management')
    .addTag('categories', 'Category & subcategory management')
    .addTag('cart', 'Shopping cart')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api`);
}
bootstrap();
