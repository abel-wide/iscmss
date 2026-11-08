import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ተማሪ መመዝገብ
  async createStudent(dto: CreateStudentDto) {
    // ኢሜል ወይም የተማሪ ኮድ ቀድሞ መኖሩን አረጋግጥ
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingCode = await this.prisma.student.findUnique({ where: { studentCode: dto.studentCode } });
    if (existingCode) throw new ConflictException('Student Code already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // User እና Student በአንድ ጊዜ መፍጠር (Transaction)
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: Role.STUDENT,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentCode: dto.studentCode,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          classId: dto.classId,
          parentId: dto.parentId,
        },
        include: {
          class: true,
          parent: { include: { user: { select: { fullName: true } } } },
        },
      });

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentId: student.id, // <-- ይህ ለ PATCH/DELETE ያገለግላል
        studentCode: student.studentCode,
      };
    });
  }

  // 2. ሁሉንም ተማሪዎች ማየት
  async findAllStudents() {
    return this.prisma.student.findMany({
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, isActive: true } },
        class: { select: { id: true, name: true } },
        parent: { include: { user: { select: { fullName: true } } } },
      },
    });
  }

  // 3. አንድ ተማሪ በ ID ማየት
  async findOneStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, isActive: true } },
        class: true,
        parent: { include: { user: true } },
        attendances: { take: 10, orderBy: { date: 'desc' } },
        marks: { include: { subject: true } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

    // 4. ተማሪ ማስተካከል
  async updateStudent(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');

    // የ Student ሞዴል መስኮች ብቻ
    const studentData: any = {};
    if (dto.studentCode) studentData.studentCode = dto.studentCode;
    if (dto.dateOfBirth) studentData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) studentData.gender = dto.gender;
    if (dto.classId) studentData.classId = dto.classId;
    if (dto.parentId) studentData.parentId = dto.parentId;

    // የ User ሞዴል መስኮች
    const userData: any = {};
    if (dto.fullName) userData.fullName = dto.fullName;
    if (dto.phone) userData.phone = dto.phone;
    if (dto.password) userData.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. Student ማዘመን (የ Student መስኮች ብቻ)
      if (Object.keys(studentData).length > 0) {
        await tx.student.update({
          where: { id },
          data: studentData,
        });
      }

      // 2. User ማዘመን (የ User መስኮች ብቻ)
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData,
        });
      }

      return { message: 'Student updated successfully', id };
    });
  }
  // 5. ተማሪ ማጥፋት
  async removeStudent(id: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');

    // User ን ስናጠፋ Student ፕሮፋይሉም በ Cascade ይጠፋል
    await this.prisma.user.delete({ where: { id: existing.userId } });
    return { message: 'Student deleted successfully' };
  }
}