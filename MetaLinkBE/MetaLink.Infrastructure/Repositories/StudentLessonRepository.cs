using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Metalink.Infrastructure.Repositories
{
    public class StudentLessonRepository : IStudentLessonRepository
    {
        private readonly AppDbContext _context;
        public StudentLessonRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<StudentLesson>> GetAllAsync()
        {
            return await _context.StudentLessons.ToListAsync();
        }

        public async Task<StudentLesson?> GetByIdAsync(int id)
        {
            return await _context.StudentLessons.FindAsync(id);
        }

        public async Task<List<StudentLesson>> GetByLessonIdAsync(int lessonId)
        {
            return await _context.StudentLessons
                .Where(sl => sl.LessonId == lessonId)
                .ToListAsync();
        }

        public async Task<List<StudentLesson>> GetByStudentIdAsync(int studentId)
        {
            return await _context.StudentLessons
                .Where(sl => sl.StudentId == studentId)
                .ToListAsync();
        }

        public async Task AddAsync(StudentLesson studentLesson)
        {
            await _context.StudentLessons.AddAsync(studentLesson);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
