import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  // 1. የአንድ ክፍል የጊዜ ሰሌዳ ማየት
  async getClassTimetable(classId: string) {
    const classExists = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classExists) throw new NotFoundException('Class not found');

    return this.prisma.timetable.findMany({
      where: { classId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // 2. አንድ የክፍለ-ጊዜ መመዝገብ
  async createEntry(dto: CreateTimetableDto) {
    // ግጭት መኖሩን ማረጋገጥ (Collision Check in same class, day, time)
    const collision = await this.prisma.timetable.findFirst({
      where: {
        classId: dto.classId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
      },
    });

    if (collision) {
      throw new ConflictException('A subject is already scheduled for this class at this day and time slot.');
    }

    return this.prisma.timetable.create({
      data: dto,
      include: {
        subject: true,
        class: true,
      },
    });
  }

  // 3. አውቶሜትድ የጊዜ ሰሌዳ ማመንጨት (Automated Timetable Generation Algorithm)
  async autoGenerateTimetable(classId: string) {
    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!targetClass) throw new NotFoundException('Class not found');

    const subjects = await this.prisma.subject.findMany();
    if (subjects.length === 0) {
      throw new ConflictException('No subjects found in system to generate timetable.');
    }

    // ያለውን የክፍል ሰሌዳ ማጽዳት (Clean existing)
    await this.prisma.timetable.deleteMany({ where: { classId } });

    // የቀን ክፍለ-ጊዜዎች (Standard Daily Periods: Monday to Friday)
    const periods = [
      { startTime: '08:30', endTime: '09:15' },
      { startTime: '09:20', endTime: '10:05' },
      { startTime: '10:20', endTime: '11:05' },
      { startTime: '11:10', endTime: '11:55' },
      { startTime: '13:00', endTime: '13:45' },
      { startTime: '13:50', endTime: '14:35' },
    ];

    const generated = [];
    let subjectIndex = 0;

    // Day 1 to 5 (Monday to Friday)
    for (let day = 1; day <= 5; day++) {
      for (const period of periods) {
        const subject = subjects[subjectIndex % subjects.length];
        subjectIndex++;

        const slot = await this.prisma.timetable.create({
          data: {
            classId,
            subjectId: subject.id,
            dayOfWeek: day,
            startTime: period.startTime,
            endTime: period.endTime,
          },
          include: {
            subject: { select: { name: true, code: true } },
          },
        });
        generated.push(slot);
      }
    }

    return {
      message: `Automated timetable successfully generated for ${targetClass.name}`,
      totalSlotsCreated: generated.length,
      schedule: generated,
    };
  }

  // 4. የክፍለ-ጊዜ ማጥፋት
  async removeEntry(id: string) {
    const existing = await this.prisma.timetable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Timetable entry not found');

    await this.prisma.timetable.delete({ where: { id } });
    return { message: 'Timetable entry deleted successfully' };
  }
}
