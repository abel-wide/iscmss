import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Gender, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertStrongPassword } from '../common/utils/password-policy';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  // 1. አዲስ ተማሪ መመዝገብ
  async createStudent(dto: CreateStudentDto) {
    assertStrongPassword(dto.password);
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingCode = await this.prisma.student.findUnique({ where: { studentCode: dto.studentCode } });
    if (existingCode) throw new ConflictException('Student Code already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

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
        studentId: student.id,
        studentCode: student.studentCode,
      };
    });
  }

  // 2. ተማሪዎችን በፍለጋና ማጣሪያ ማየት (Search by Name, Code, Class, Gender)
  async findAllStudents(search?: string, classId?: string, gender?: Gender) {
    const where: any = {};
    if (classId) where.classId = classId;
    if (gender) where.gender = gender;
    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true, isActive: true } },
        class: { select: { id: true, name: true, gradeLevel: true } },
        parent: { include: { user: { select: { fullName: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
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
        attendances: { take: 15, orderBy: { date: 'desc' } },
        marks: { include: { subject: true } },
        payments: { orderBy: { dueDate: 'desc' } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  // 4. ተማሪ ማስተካከል / ክፍል ማዘዋወር (Enrollment / Class Assignment)
  async updateStudent(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');

    const studentData: any = {};
    if (dto.studentCode) studentData.studentCode = dto.studentCode;
    if (dto.dateOfBirth) studentData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) studentData.gender = dto.gender;
    if (dto.classId !== undefined) studentData.classId = dto.classId;
    if (dto.parentId !== undefined) studentData.parentId = dto.parentId;

    const userData: any = {};
    if (dto.fullName) userData.fullName = dto.fullName;
    if (dto.phone) userData.phone = dto.phone;
    if (dto.password) userData.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(studentData).length > 0) {
        await tx.student.update({
          where: { id },
          data: studentData,
        });
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData,
        });
      }

      return { message: 'Student enrollment updated successfully', id };
    });
  }

  // 5. ተማሪ ማጥፋት
  async removeStudent(id: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Student not found');

    await this.prisma.user.delete({ where: { id: existing.userId } });
    return { message: 'Student deleted successfully' };
  }
}
