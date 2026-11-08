import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. አስተማሪ መፍጠር
  async createTeacher(dto: CreateTeacherDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // User እና Teacher በአንድ ጊዜ መፍጠር (Transaction)
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: Role.TEACHER,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          qualification: dto.qualification,
          subjectSpecialty: dto.subjectSpecialty,
        },
      });

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        teacherId: teacher.id,
      };
    });
  }

  // 2. ሁሉንም አስተማሪዎች ማየት
  async findAllTeachers() {
    return this.prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        teacher: {
          select: {
            qualification: true,
            subjectSpecialty: true,
          },
        },
      },
    });
  }

  // 3. አንድ አስተማሪ በ ID ማየት
  async findOneTeacher(id: string) {
    const teacher = await this.prisma.user.findFirst({
      where: { id, role: Role.TEACHER },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        teacher: {
          select: {
            qualification: true,
            subjectSpecialty: true,
          },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  // 4. አስተማሪ ማስተካከል
  async updateTeacher(id: string, dto: UpdateTeacherDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, role: Role.TEACHER },
    });
    if (!existing) throw new NotFoundException('Teacher not found');

    const dataToUpdate: any = { ...dto };
    
    // የይለፍ ቃል ካለ ሃሽ አድርገን እናስቀምጠው
    if (dto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dataToUpdate.password;
    }

    // የአስተማሪውን መረጃ ማዘመን
    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: dataToUpdate,
      });

      if (dto.qualification || dto.subjectSpecialty) {
        await tx.teacher.update({
          where: { userId: id },
          data: {
            qualification: dto.qualification,
            subjectSpecialty: dto.subjectSpecialty,
          },
        });
      }

      return { message: 'Teacher updated successfully', id: updatedUser.id };
    });
  }

  // 5. አስተማሪ ማጥፋት
  async removeTeacher(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, role: Role.TEACHER },
    });
    if (!existing) throw new NotFoundException('Teacher not found');

    // User ን ስናጠፋ Teacher ፕሮፋይሉም በ Cascade ይጠፋል (በ schema ላይ እንደተዘጋጀው)
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Teacher deleted successfully' };
  }
}