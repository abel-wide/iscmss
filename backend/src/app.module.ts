import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { AttendanceModule } from './attendance/attendance.module'; 
import { GradesModule } from './grades/grades.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ResourcesModule } from './resources/resources.module';
import { ChatModule } from './chat/chat.module';
import { TimetableModule } from './timetable/timetable.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { ExamsModule } from './exams/exams.module';
import { SubjectsModule } from './subjects/subjects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule, 
    StudentsModule,
    AttendanceModule,
    GradesModule,
    PaymentsModule,
    NotificationsModule,
    ResourcesModule,
    ChatModule,
    TimetableModule,
    ReportsModule,
    SearchModule,
    ExamsModule,
    SubjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
