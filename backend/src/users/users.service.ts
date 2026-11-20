import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreateParentDto } from './dto/create-parent.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertStrongPassword } from '../common/utils/password-policy';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. መምህር መፍጠር
  async createTeacher(dto: CreateTeacherDto) {
    assertStrongPassword(dto.password);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

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

  // 2. የስራ ኃላፊ መፍጠር (Head, Registrar, Admin)
  async createStaff(dto: CreateStaffDto) {
    assertStrongPassword(dto.password);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: dto.role,
        },
      });

      if (dto.role === Role.ADMIN) {
        await tx.admin.create({ data: { userId: user.id } });
      } else if (dto.role === Role.REGISTRAR) {
        await tx.registrar.create({ data: { userId: user.id } });
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      };
    });
  }

  // 3. ወላጅ መፍጠር (Parent registration with optional student linkage)
  async createParent(dto: CreateParentDto) {
    assertStrongPassword(dto.password);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: Role.PARENT,
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          relationship: dto.relationship,
        },
      });

      if (dto.studentIds && dto.studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: dto.studentIds } },
          data: { parentId: parent.id },
        });
      }

      return {
        id: user.id,
        parentId: parent.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      };
    });
  }

  // 4. ወላጅ እና ተማሪ ማገናኘት (Link Parent and Student)
  async linkParentStudent(parentId: string, studentId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent not found');

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId: parent.id },
    });
  }

  // 5. ሁሉንም አስተማሪዎች ማየት
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
            id: true,
            qualification: true,
            subjectSpecialty: true,
          },
        },
      },
    });
  }

  // 6. ሁሉንም ተጠቃሚዎች በ Role ማየት
  async findAllUsers(role?: Role) {
    const where: any = {};
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        teacher: { select: { id: true, qualification: true, subjectSpecialty: true } },
        parent: { select: { id: true, relationship: true, students: { select: { id: true, studentCode: true } } } },
        student: { select: { id: true, studentCode: true, class: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 7. አንድ አስተማሪ በ ID ማየት
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
            id: true,
            qualification: true,
            subjectSpecialty: true,
          },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  // 8. አስተማሪ ማስተካከል
  async updateTeacher(id: string, dto: UpdateTeacherDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, role: Role.TEACHER },
    });
    if (!existing) throw new NotFoundException('Teacher not found');

    const dataToUpdate: any = { ...dto };
    if (dto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(dto.password, 10);
      delete dataToUpdate.password;
    }

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

  // 9. ተጠቃሚን ማንቃት/ማቦዘን (Activate / Deactivate User)
  async toggleUserStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  // 10. ተጠቃሚ ማጥፋት
  async removeUser(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
