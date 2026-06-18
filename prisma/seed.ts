import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Professor ---
  const professor = await prisma.user.upsert({
    where: { email: 'profesor@demo.com' },
    update: {},
    create: {
      username: 'profesor',
      email: 'profesor@demo.com',
      password: passwordHash,
      role: Role.PROFESSOR,
    },
  });

  // --- Students ---
  const students = await Promise.all(
    [
      { username: 'ana', email: 'ana@demo.com' },
      { username: 'carlos', email: 'carlos@demo.com' },
      { username: 'lucia', email: 'lucia@demo.com' },
    ].map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          username: s.username,
          email: s.email,
          password: passwordHash,
          role: Role.STUDENT,
        },
      }),
    ),
  );

  // --- Demo quiz (only create if the professor has none yet) ---
  const existingQuiz = await prisma.quiz.findFirst({
    where: { professorId: professor.id },
  });

  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        title: 'Cultura general: fundamentos de informática',
        description:
          'Cuestionario de ejemplo con 4 preguntas de opción múltiple para probar la plataforma.',
        isActive: true,
        professorId: professor.id,
        questions: {
          create: [
            {
              text: '¿Qué significa "CPU"?',
              order: 0,
              options: {
                create: [
                  { text: 'Central Processing Unit', isCorrect: true },
                  { text: 'Computer Personal Unit', isCorrect: false },
                  { text: 'Central Print Utility', isCorrect: false },
                  { text: 'Control Power Unit', isCorrect: false },
                ],
              },
            },
            {
              text: '¿Cuál de estos es un lenguaje de programación?',
              order: 1,
              options: {
                create: [
                  { text: 'HTTP', isCorrect: false },
                  { text: 'Python', isCorrect: true },
                  { text: 'JPEG', isCorrect: false },
                  { text: 'HTML5 Cache', isCorrect: false },
                ],
              },
            },
            {
              text: '¿Qué estructura de datos sigue el principio LIFO?',
              order: 2,
              options: {
                create: [
                  { text: 'Cola (Queue)', isCorrect: false },
                  { text: 'Lista enlazada', isCorrect: false },
                  { text: 'Pila (Stack)', isCorrect: true },
                  { text: 'Árbol binario', isCorrect: false },
                ],
              },
            },
            {
              text: '¿Cuántos bits tiene un byte?',
              order: 3,
              options: {
                create: [
                  { text: '4', isCorrect: false },
                  { text: '8', isCorrect: true },
                  { text: '16', isCorrect: false },
                  { text: '32', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✅ Demo quiz created.');
  }

  // --- Welcome message (general) ---
  const existingMessage = await prisma.message.findFirst({
    where: { senderId: professor.id, type: 'GENERAL' },
  });
  if (!existingMessage) {
    await prisma.message.create({
      data: {
        senderId: professor.id,
        content:
          '¡Bienvenidos a la plataforma! Ya tenéis disponible el primer cuestionario. Recordad que solo se puede realizar una vez.',
        type: 'GENERAL',
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Professor login -> profesor@demo.com / password123');
  console.log(`   Students        -> ${students.map((s) => s.email).join(', ')} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
