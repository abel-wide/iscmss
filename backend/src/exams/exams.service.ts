import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ObjectiveQuestion {
  id: string;
  questionText: string;
  options: string[]; // e.g. ["A", "B", "C", "D"]
  correctOptionIndex: number;
  points: number;
}

export interface ExamDefinition {
  id: string;
  title: string;
  subjectCode: string;
  durationMinutes: number;
  questions: ObjectiveQuestion[];
}

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  // Mock standard objective exams store (can be extended with custom tests)
  private exams: ExamDefinition[] = [
    {
      id: 'exam-math-midterm',
      title: 'Mathematics Midterm Objective Assessment',
      subjectCode: 'MATH101',
      durationMinutes: 45,
      questions: [
        {
          id: 'q1',
          questionText: 'What is the derivative of f(x) = 3x^2 + 5x - 7?',
          options: ['6x + 5', '3x + 5', '6x - 7', 'x^3 + 5'],
          correctOptionIndex: 0,
          points: 25,
        },
        {
          id: 'q2',
          questionText: 'If 2x - 4 = 10, what is the value of x?',
          options: ['5', '6', '7', '8'],
          correctOptionIndex: 2,
          points: 25,
        },
        {
          id: 'q3',
          questionText: 'Which of the following is a prime number?',
          options: ['9', '15', '29', '33'],
          correctOptionIndex: 2,
          points: 25,
        },
        {
          id: 'q4',
          questionText: 'What is the value of sin(90 degrees)?',
          options: ['0', '0.5', '1', '-1'],
          correctOptionIndex: 2,
          points: 25,
        },
      ],
    },
    {
      id: 'exam-phy-unit1',
      title: 'Physics Mechanics Objective Quiz',
      subjectCode: 'PHY101',
      durationMinutes: 30,
      questions: [
        {
          id: 'p1',
          questionText: 'What is the SI unit of Force?',
          options: ['Joule', 'Newton', 'Watt', 'Pascal'],
          correctOptionIndex: 1,
          points: 50,
        },
        {
          id: 'p2',
          questionText: 'Acceleration due to gravity on Earth surface is approximately:',
          options: ['8.9 m/s^2', '9.8 m/s^2', '10.5 m/s^2', '12.0 m/s^2'],
          correctOptionIndex: 1,
          points: 50,
        },
      ],
    },
  ];

  // 1. የፈተናዎች ዝርዝር ማየት
  async getAvailableExams() {
    return this.exams.map((e) => ({
      id: e.id,
      title: e.title,
      subjectCode: e.subjectCode,
      durationMinutes: e.durationMinutes,
      totalQuestions: e.questions.length,
      totalMarks: e.questions.reduce((a, q) => a + q.points, 0),
    }));
  }

  // 2. የተወሰነ ፈተና ማየት (ጥያቄዎቹን ብቻ ለተማሪው ያሳያል፤ ትክክለኛ መልሱን ይደብቃል)
  async getExamForStudent(examId: string) {
    const exam = this.exams.find((e) => e.id === examId);
    if (!exam) throw new NotFoundException('Exam not found');

    return {
      id: exam.id,
      title: exam.title,
      subjectCode: exam.subjectCode,
      durationMinutes: exam.durationMinutes,
      questions: exam.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        points: q.points,
      })),
    };
  }

  // 3. አውቶሜትድ ማረም (Automated Exam Marking Engine for Objective Questions)
  async submitAndAutoGrade(data: {
    examId: string;
    studentId: string;
    answers: Record<string, number>; // { [questionId]: selectedOptionIndex }
  }) {
    const exam = this.exams.find((e) => e.id === data.examId);
    if (!exam) throw new NotFoundException('Exam not found');

    let earnedScore = 0;
    const totalMarks = exam.questions.reduce((a, q) => a + q.points, 0);
    const questionReview = [];

    for (const q of exam.questions) {
      const studentAnswer = data.answers[q.id];
      const isCorrect = studentAnswer === q.correctOptionIndex;
      if (isCorrect) {
        earnedScore += q.points;
      }
      questionReview.push({
        questionId: q.id,
        question: q.questionText,
        selectedOption: studentAnswer !== undefined ? q.options[studentAnswer] : 'Not Answered',
        correctOption: q.options[q.correctOptionIndex],
        isCorrect,
        pointsAwarded: isCorrect ? q.points : 0,
      });
    }

    const percentage = Number(((earnedScore / totalMarks) * 100).toFixed(1));

    // የትምህርት አይነቱን ፈልጎ ወደ Grade Mark ማስገባት (Automatically sync mark into database)
    const subject = await this.prisma.subject.findFirst({
      where: { code: exam.subjectCode },
    });

    if (subject && data.studentId) {
      try {
        const student = await this.prisma.student.findUnique({
          where: { id: data.studentId },
          include: { class: { include: { roomTeacher: true } } },
        });

        if (student) {
          const teacher = await this.prisma.teacher.findFirst();
          if (teacher) {
            await this.prisma.mark.upsert({
              where: {
                studentId_subjectId: {
                  studentId: data.studentId,
                  subjectId: subject.id,
                },
              },
              update: {
                finalExam: percentage,
                total: percentage,
              },
              create: {
                studentId: data.studentId,
                subjectId: subject.id,
                teacherId: teacher.id,
                assessment: 0,
                finalExam: percentage,
                total: percentage,
              },
            });
          }
        }
      } catch (err) {
        // Sync warning
      }
    }

    return {
      examTitle: exam.title,
      studentId: data.studentId,
      earnedScore,
      totalPossibleMarks: totalMarks,
      percentageScore: `${percentage}%`,
      passed: percentage >= 60,
      autoGradedAt: new Date(),
      breakdown: questionReview,
    };
  }
}
